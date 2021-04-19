from flask import Blueprint, render_template, redirect, url_for, request, flash
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_manager, login_user, logout_user, login_required

from tetris.models import User
from tetris.db import DB_HOST, DB_PORT, RDB

auth = Blueprint("auth", __name__)


@auth.route("/login")
def login():
    return render_template("login.html")


@auth.route("/signup")
def signup():
    return render_template("signup.html")


@auth.route("/login", methods=["POST"])
def login_post():
    name = request.form.get("name")
    password = request.form.get("password")
    remember = True if request.form.get("remember") else False

    connection = RDB.connect(DB_HOST, DB_PORT)
    credentials = RDB.db("Tetris").table("users").get(name).run(connection)
    if not credentials or not check_password_hash(credentials["password"], password):
        flash("Please check your login details and try again.")
        return redirect(url_for("auth.login"))

    login_user(User(**credentials), remember=remember)
    return redirect(url_for("main.profile"))


@auth.route("/signup", methods=["POST"])
def signup_post():
    name = request.form.get("name")
    password = request.form.get("password")
    password = generate_password_hash(password, method="sha256")

    connection = RDB.connect(DB_HOST, DB_PORT)
    existing_user = RDB.db("Tetris").table("users").get(name).run(connection)

    if existing_user:
        flash("name already exists")
        return redirect(url_for("auth.signup"))

    user = {"name": name, "password": password}
    RDB.db("Tetris").table("users").insert(user).run(connection)

    return redirect(url_for("auth.login"))


@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return render_template("signup.html")
