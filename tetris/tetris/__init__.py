from flask import Flask
from flask_login import LoginManager

import os

from tetris.models import User
from tetris.db import DB_HOST, DB_PORT, RDB

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.environ['FLASK_SECRET_KEY']
    app.config['DB_HOST'] = DB_HOST
    app.config['DB_PORT'] = DB_PORT

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(name):
        connection = RDB.connect(DB_HOST, DB_PORT)
        credentials = RDB.db("Tetris").table("users").get(name).run(connection)
        return User(**credentials)

    # blueprint for auth routes in our app
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # blueprint for non-auth parts of app
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app
