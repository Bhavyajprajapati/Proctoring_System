from flask import Flask
from .routes.main_routes import main

from config import UPLOAD_FOLDER
import os

def create_app():
    app = Flask(__name__)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.register_blueprint(main)
    return app