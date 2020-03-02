from flask import Blueprint, render_template
from flask_login import login_required, current_user

from tetris.db import DB_HOST, DB_PORT, RDB

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
    return render_template("game.html", name=current_user.name, mode='play')


@main.route("/watch")
@login_required
def watch():
    connection = RDB.connect(DB_HOST, DB_PORT)
    games = RDB.db('Tetris').table('moves').filter((RDB.row['userId'] == current_user.name)).order_by('gameId', 'ticks').pluck('gameId').distinct().run(connection)
    return render_template("game.html", name=current_user.name, mode='watch', games=games)


@main.route("/debug")
@login_required
def debug():
    connection = RDB.connect(DB_HOST, DB_PORT)
    games = RDB.db('Tetris').table('moves').filter((RDB.row['userId'] == current_user.name)).order_by('gameId', 'ticks').pluck('gameId').distinct().run(connection)
    return render_template("game.html", name=current_user.name, mode='debug', games=games)


@main.route("/test")
@login_required
def test():
    return render_template("game.html", name=current_user.name, mode='test')

