from flask import Blueprint,jsonify

from controller.QA_PDF import (
    process_pdf,
    handle_file_upload,
)

QA_PDF_bp = Blueprint("QA_PDF", __name__)

# Route to handle PDF upload and processing
@QA_PDF_bp.route("/upload", methods=["POST"])
def upload_pdf():
    res = handle_file_upload()
    filename = str(res["data"])

    if isinstance(filename, str):
        # Process PDF after uploading
        return process_pdf(filename)
    else:
        return jsonify(res)  # Return the error response from handle_file_upload
