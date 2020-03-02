from flask import Blueprint, render_template
from flask_login import login_required, current_user

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/profile")
@login_required
def profile():
    return render_template("profile.html", name=current_user.name)


@main.route("/play")
@login_required
def play():
    return render_template("Tetris.html", name=current_user.name)


@main.route("/watch")
@login_required
def watch():
    return render_template("Replay.html", name=current_user.name)


@main.route("/debug")
@login_required
def debug():
    return render_template("DebugReplay.html", name=current_user.name)


@main.route("/test")
@login_required
def test():
    return render_template("Brain.html", name=current_user.name)

