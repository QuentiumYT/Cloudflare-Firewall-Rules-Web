#!/usr/bin/env python

import os, dotenv
from flask import Flask, Blueprint, render_template, request, flash, redirect, url_for, send_file
from cf_rules import Cloudflare

dotenv.load_dotenv()
if os.environ.get("FLASK_SECRET"):
    secret = os.environ.get("FLASK_SECRET")
else:
    secret = os.urandom(12).hex()

app = Flask(__name__)
app.config["SECRET_KEY"] = secret



@app.route("/get-file/")
@app.route("/get-file/<path:filename>")
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

    with open("expressions/" + filename, "wb") as file:
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


@app.route("/")
@app.route("/index")
@app.route("/home")
def index():
    rules = os.listdir(cf.utils.directory)

    return render_template("index.jinja2", rules=rules)

@app.route("/profile")
def profile():
    return render_template("profile.jinja2")



auth = Blueprint("auth", __name__)

@auth.route("/login-key", methods=["POST"])
def login_key():
    email = request.form.get("email")
    key = request.form.get("key")

    print(email, key)

    r = cf.auth_key(email, key)

    if r["success"]:
        return redirect(url_for("index"))

    flash(r, "error_key")
    return redirect(url_for("profile"))

@auth.route("/login-token", methods=["POST"])
def login_token():
    token = request.form.get("token")

    r = cf.auth_token(token)

    if r["success"]:
        return redirect(url_for("index"))

    flash(r, "error_token")
    return redirect(url_for("profile"))



if __name__ == "__main__":
    cf = Cloudflare()

    app.register_blueprint(auth)

    app.run(host="0.0.0.0",
            port=5502,
            debug=True)
