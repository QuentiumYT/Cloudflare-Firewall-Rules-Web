#!/usr/bin/env python

import os, dotenv
from flask import Flask, Blueprint, render_template, request, abort, flash, redirect, url_for, send_file
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from cf_rules import Cloudflare

dotenv.load_dotenv()
if os.environ.get("FLASK_SECRET"):
    secret = os.environ.get("FLASK_SECRET")
else:
    secret = os.urandom(12).hex()

app = Flask(__name__)
app.config["SECRET_KEY"] = secret

login_manager = LoginManager()
login_manager.login_view = "profile"
login_manager.init_app(app)

class User(UserMixin):
    id = None
    email = None
    domains = None

current_users: dict[str, User] = {}

is_docker = os.getcwd() == "/"
if is_docker:
    os.chdir("/var/www/web/")

is_login_key = os.environ.get("CF_EMAIL") and os.environ.get("CF_API_KEY")
is_login_token = os.environ.get("CF_API_TOKEN")



@app.route("/get-file/")
@app.route("/get-file/<path:filename>", methods=["GET"])
def get_file(filename=None):
    if not filename:
        return {"error": "No file path provided"}, 400

    if not os.path.isfile(cf.utils.directory + "/" + filename):
        return {"error": "File not found"}, 404

    filename = filename.replace("%20", "")

    return send_file(cf.utils.directory + "/" + filename)

@app.route("/save-file/")
@app.route("/save-file/<path:filename>", methods=["POST"])
def save_file(filename=None):
    if not filename:
        return {"error": "No file path provided"}, 400

    with open(cf.utils.directory + "/" + filename, "wb") as file:
        file.write(request.data)

    return {"success": "File saved"}

@app.route("/delete-file/")
@app.route("/delete-file/<path:filename>", methods=["DELETE"])
def delete_file(filename=None):
    if not filename:
        return {"error": "No file path provided"}, 400

    if not os.path.isfile(cf.utils.directory + "/" + filename):
        return {"error": "File not found"}, 404

    filename = filename.replace("%20", "")

    os.remove(cf.utils.directory + "/" + filename)

    return {"success": "File deleted"}

@app.route("/send-rule", methods=["POST"])
def send_rule():
    domains = request.form.getlist("domains")
    action = request.form.get("action")
    rule = request.form.get("rule")

    if rule:
        rule = rule.replace(".txt", "")
    else:
        flash("No rule provided", "danger")

        return redirect(url_for("index"))

    if not domains:
        flash("No domains provided", "danger")

        return redirect(url_for("index"))

    success = {}
    failed = {}
    if action == "create":
        for domain in domains:
            r = cf.create_rule(domain, rule, rule)
            if r:
                success[domain] = str(r)
            else:
                failed[domain] = r["error"]
    elif action == "update":
        for domain in domains:
            r = cf.update_rule(domain, rule, rule)
            if r:
                success[domain] = str(r)
            else:
                failed[domain] = r["error"]
    elif action == "delete":
        for domain in domains:
            r = cf.delete_rule(domain, rule)
            if r:
                success[domain] = str(r)
            else:
                failed[domain] = r["error"]
    else:
        flash("No action was specified.", "danger")

    if success:
        flash(f"Rule '{rule}' has been successfully {action}d in {', '.join(success.keys())}.", "success")
    if failed:
        error = "<br>- ".join([x + ": " + y for x, y in failed.items()])
        flash(f"An issue ocurred when {action[:-1]}ing '{rule}' in {', '.join(failed.keys())}.<br>{error}", "warning")

    return redirect(url_for("index"))

@app.route("/list-domains")
def list_domains():
    if not current_user.is_authenticated:
        return {"error": "Not logged in"}, 400

    return {"domains": current_user.domains}

@app.route("/list-rules")
@app.route("/list-rules/<domain>")
def list_rules(domain=None):
    if not current_user.is_authenticated:
        return {"error": "Not logged in"}, 400

    if not domain:
        return {"error": "No domain provided"}, 400

    return {"rules": cf.rules(domain)}

@app.route("/import-rule", methods=["POST"])
def import_rule():
    domain = request.form.get("domain")
    rule = request.form.get("rule")

    cf.export_rule(domain, rule)

    return {"success": "Rule imported successfully"}



@app.route("/")
@app.route("/index")
@app.route("/home")
def index():
    rules = os.listdir(cf.utils.directory)

    if current_user.is_authenticated:
        user = current_users[current_user.id]
        if user.domains == None:
            domains = cf.domains
            user.domains = domains
        else:
            domains = user.domains
    else:
        domains = []

    return render_template("index.jinja2", user=current_user, rules=rules, domains=domains)

@app.route("/profile", methods=["GET", "POST"])
def profile():
    # Autologin if app started and private usage
    if len(current_users) == 0:
        if is_login_key:
            auth = cf.auth_key(os.environ.get("CF_EMAIL"), os.environ.get("CF_API_KEY"))

            with app.app_context():
                handle_auth(auth, "key")

        elif is_login_token:
            auth = cf.auth_token(os.environ.get("CF_API_TOKEN"))

            with app.app_context():
                handle_auth(auth, "token")

        cf.utils.change_directory("expressions_ug")

        return redirect(url_for("index"))

    if request.method == "POST":
        new_directory = request.form.get("directory")
        cf.utils.change_directory(new_directory.strip("/"))

        if "refresh_domains" in request.form:
            user = current_users[current_user.id]
            user.domains = cf.domains

    directory = cf.utils.directory

    return render_template("profile.jinja2", user=current_user, directory=directory)

@app.route("/components")
def components():
    if app.debug:
        return render_template("components.jinja2")
    else:
        abort(404)



auth = Blueprint("auth", __name__)

def handle_auth(auth: dict, method: str):
    if auth["success"]:
        user = User()
        user.id = auth["result"]["id"]
        if method == "key":
            user.email = auth["result"]["email"]

        login_user(user, remember=True)

        current_users[user.id] = user

        return redirect(url_for("index"))
    else:
        if auth["errors"][0]["code"] == 6003:
            error = auth["errors"][0]["error_chain"][0]["message"]
        else:
            error = auth["errors"][0]["message"]

    flash(error, f"error_{method}")

    return redirect(url_for("profile"))

@auth.route("/login-key", methods=["POST"])
def login_key():
    email = request.form.get("email")
    key = request.form.get("key")

    auth = cf.auth_key(email, key)

    return handle_auth(auth, "key")

@auth.route("/login-token", methods=["POST"])
def login_token():
    token = request.form.get("token")

    auth = cf.auth_token(token)

    return handle_auth(auth, "token")

@auth.route("/logout", methods=["POST"])
def logout():
    del current_users[current_user.id]

    logout_user()

    return redirect(url_for("profile"))

@login_manager.user_loader
def load_user(user_id):
    user = current_users.get(user_id)

    return user



if __name__ == "__main__":
    cf = Cloudflare()

    app.register_blueprint(auth)

    app.run(host="0.0.0.0",
            port=80 if is_docker else 5502,
            debug=True)
