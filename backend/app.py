from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import pandas as pd
import os
import json
from dotenv import load_dotenv
import random
from routes.QA_XLX_CSV import QA_XLX_CSV_bp
from routes.test_generation import test_gen_bp
from routes.QA_LLM import QA_LLM_bp
from routes.QA_PDF import QA_PDF_bp
from routes.home import home_bp
from routes.proctoring_routes import proctoring_routes

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)  

app.register_blueprint(QA_XLX_CSV_bp)
app.register_blueprint(test_gen_bp)
app.register_blueprint(QA_PDF_bp)
app.register_blueprint(QA_LLM_bp)
app.register_blueprint(home_bp)
app.register_blueprint(proctoring_routes)


@app.errorhandler(404)
def not_found(e):
    res = {"status": 404, "success": False, "message": "Resource not found", "data": ""}
    return jsonify(res)


@app.errorhandler(Exception)
def base_handler():
    res = {
        "status": 500,
        "success": False,
        "message": "Something went wrong",
        "data": "",
    }
    return jsonify(res)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
