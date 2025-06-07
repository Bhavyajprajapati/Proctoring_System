from flask import jsonify, request, send_from_directory
from dotenv import load_dotenv
import google.generativeai as genai
import os, json, re
from werkzeug.utils import secure_filename
import PyPDF2

load_dotenv()

genai.configure(api_key=os.getenv("API_KEY"))

# Ensure 'uploads' directory exists
UPLOAD_FOLDER = "static/uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Allowed file extensions
ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_pdf_text(pdf_path):
    text = ""
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page_num in range(len(reader.pages)):
            text += reader.pages[page_num].extract_text()
    return text


def handle_file_upload():
    if "file" not in request.files:
        return {
            "status": 300,
            "success": False,
            "message": "File not found in request body",
            "data": "",
        }
    file = request.files["file"]
    if file.filename == "":
        return {
            "status": 300,
            "success": False,
            "message": "File not found in request body",
            "data": "",
        }
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        return {
            "status": 200,
            "success": True,
            "message": "File saved successfully",
            "data": filename,
        }  # Return the saved file path or filename
    else:
        return {
            "status": 300,
            "success": False,
            "message": "File type not allowed",
            "data": "",
        }


def clean_json_string(input_str):
    return re.sub(r"```json|```|\\n", "", input_str).strip()


def process_pdf(filename):
    try:
        message = list()

        # Extract text from the uploaded PDF
        pdf_path = os.path.join(UPLOAD_FOLDER, filename)
        pdf_text = extract_pdf_text(pdf_path)

        # Generate prompt from PDF text
        prompt = f"Generate 20 MCQs keeping blooms taxonomy in center and ensuring that all levels of blooms taxonomy (remember, understand, apply, analyze, evaluate, create) are covered in equal proportion from the following text :\n{pdf_text}\n\n Generate response with the following JSON format: ('questions':(('id':1,'question':'What is...?','options':('opa','opb','opc','opd'),'correct_answer':'A','BT_Level':'Understand','topic':'topic1','subtopic':'subtopic1'))) Ensure that output contains questions sorted in order of blooms taxonomy levels :- remember, understand, analyze, apply, evaluate, create and the response is valid JSON without additional formatting. And Change (round brackets as per you required Format for JSON), if pdf text Contains Some Bracket which violets the rule for json while you add them into responce please be carefull and use another notation."

        model_name = "models/gemini-1.5-flash"

        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)

        data = response.text
        data = clean_json_string(data)
        parsed_data = json.loads(data)

        return jsonify(
            {
                "status": 200,
                "success": True,
                "message": "Questions generated successfully",
                "data": parsed_data,
            }
        )
    except Exception as e:
        return jsonify(
            {
                "status": 500,
                "success": False,
                "message": "Failed to generate questions",
                "data": str(e),
            }
        )
