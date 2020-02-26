from flask import Flask
import rethinkdb as rdb

def create_app():
    app = Flask(__name__)

    # app.config['SECRET_KEY'] = '9OLWxND4o83j4K4iuopO'
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'

    # blueprint for auth routes in our app
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # blueprint for non-auth parts of app
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app