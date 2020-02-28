from flask import Flask
from flask_login import LoginManager
import os

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.environ['FLASK_SECRET_KEY']
    app.config['DB_HOST'] = os.environ.get('DB_HOST', 'localhost')
    app.config['DB_PORT'] = os.environ.get('DB_PORT', 28015)

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return None  # User.query.get(int(user_id))

    # blueprint for auth routes in our app
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # blueprint for non-auth parts of app
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app