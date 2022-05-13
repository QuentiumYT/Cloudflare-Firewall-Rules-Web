#!/usr/bin/env python

import os, dotenv
from flask import Flask, Blueprint, render_template, request, flash, redirect, url_for, send_file
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

    # TODO return actual error if failed
    success = {}
    failed = {}
    if action == "create":
        for domain in domains:
            r = cf.create_rule(domain, rule, rule)
            if r == True:
                success[domain] = str(r)
            else:
                failed[domain] = r["error"]
    elif action == "update":
        for domain in domains:
            r = cf.update_rule(domain, rule, rule)
            if r == True:
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
    if request.method == "POST":
        new_directory = request.form.get("directory")
        cf.utils.change_directory(new_directory.strip("/"))

    directory = cf.utils.directory

    return render_template("profile.jinja2", user=current_user, directory=directory)



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
            port=5502,
            debug=True)
