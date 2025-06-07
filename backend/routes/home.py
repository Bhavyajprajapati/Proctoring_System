from flask import Blueprint

from controller.home import (
    Home,
)

home_bp = Blueprint("home", __name__)

# Route to serve the homepage
@home_bp.route("/", methods=["GET"])
def home():
    return Home()