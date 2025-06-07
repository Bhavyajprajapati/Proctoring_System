from flask import Blueprint,Flask, request, jsonify
from flask_cors import CORS

from controller.QA_LLM import (
    get_questions,
)

QA_LLM_bp = Blueprint("QA_LLM", __name__)
CORS(QA_LLM_bp)

@QA_LLM_bp.route('/api/questions', methods=['GET'])
def api_questions():
  
    skill = request.args.get('skill')
    total_questions = request.args.get('totalQuestions')

   
    if not skill or not total_questions:
        return jsonify({"error": "Missing required parameters: skill and totalQuestions"}), 400

    try:
       
        data = get_questions(total_questions, skill)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500