import speech_recognition as sr
import os
import datetime
from flask import Blueprint, render_template, request, jsonify
import face_recognition
import cv2
import mediapipe as mp
from ultralytics import YOLO
import numpy as np
from scipy.io import wavfile
import subprocess

main = Blueprint("main", __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load YOLOv8 model once (will download if not present)
yolo_model = YOLO("yolov8n.pt")


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/snapshot", methods=["POST"])
def save_snapshot():
    snapshot = request.files.get("snapshot")
    if not snapshot:
        return "No snapshot provided", 400

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"snapshot_{timestamp}.jpg"
    path = os.path.join(UPLOAD_FOLDER, filename)
    snapshot.save(path)

    log_path = os.path.join(UPLOAD_FOLDER, "events.log")
    reference_path = os.path.join(UPLOAD_FOLDER, "reference.jpg")

    try:
        # Run YOLOv8 for phone detection on the image
        results = yolo_model(path)
        detected_objects = results[0].names
        detected_labels = [
            detected_objects[int(cls)] for cls in results[0].boxes.cls.cpu().numpy()
        ]

        phone_detected = any(
            label.lower() in ["cell phone", "phone"] for label in detected_labels
        )
        with open(log_path, "a") as log:
            if phone_detected:
                log.write(f"{timestamp} - ALERT: Phone detected in {filename}\n")

        # Face recognition steps
        image = face_recognition.load_image_file(path)
        face_encodings = face_recognition.face_encodings(image)

        with open(log_path, "a") as log:
            if len(face_encodings) == 0:
                log.write(f"{timestamp} - ALERT: No face detected in {filename}\n")
                return "No face detected", 200
            if len(face_encodings) > 1:
                log.write(
                    f"{timestamp} - ALERT: Multiple faces detected in {filename}\n"
                )
                return "Multiple faces detected", 200

            # If no reference face, save first snapshot as reference
            if not os.path.exists(reference_path):
                snapshot.seek(0)
                snapshot.save(reference_path)
                log.write(f"{timestamp} - INFO: Saved first image as reference.jpg\n")
                return "Reference face saved", 200

            # Load and encode reference face
            ref_image = face_recognition.load_image_file(reference_path)
            ref_encodings = face_recognition.face_encodings(ref_image)

            if len(ref_encodings) == 0:
                log.write(f"{timestamp} - ERROR: No face in reference.jpg\n")
                return "Reference face missing", 500

            # Compare current face to reference face
            is_match = face_recognition.compare_faces(ref_encodings, face_encodings[0])[
                0
            ]

            if is_match:
                log.write(
                    f"{timestamp} - OK: Face matched with reference in {filename}\n"
                )
            else:
                log.write(f"{timestamp} - ALERT: Face mismatch in {filename}\n")

    except Exception as e:
        with open(log_path, "a") as log:
            log.write(
                f"{timestamp} - ERROR: Exception during snapshot processing: {str(e)}\n"
            )
        return f"Error processing snapshot: {e}", 500

    return "Snapshot processed", 200


@main.route("/check_blink", methods=["POST"])
def check_blink():
    # Receive image frame for blink/liveness check (placeholder logic)
    image_file = request.files.get("frame")
    if not image_file:
        return jsonify({"status": "error", "message": "No frame provided"}), 400

    image_path = os.path.join(UPLOAD_FOLDER, "blink_frame.jpg")
    image_file.save(image_path)

    image = cv2.imread(image_path)
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)
    results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    if not results.multi_face_landmarks:
        return jsonify({"status": "error", "message": "No face detected"}), 404

    # TODO: Implement blink detection using landmarks here

    return jsonify(
        {"status": "success", "message": "Face detected (blink check placeholder)"}
    )


@main.route("/mic-audio", methods=["POST"])
def mic_audio():
    audio_data = request.data
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    webm_path = os.path.join(UPLOAD_FOLDER, f"audio_{timestamp}.webm")
    wav_path = os.path.join(UPLOAD_FOLDER, f"audio_{timestamp}.wav")
    log_path = os.path.join(UPLOAD_FOLDER, "events.log")

    # Save raw webm audio file
    with open(webm_path, "wb") as f:
        f.write(audio_data)

    # Convert webm to wav using ffmpeg (must be installed on server)
    subprocess.run(
        ["ffmpeg", "-y", "-i", webm_path, wav_path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        # Load audio for basic volume check
        rate, data = wavfile.read(wav_path)
        audio_volume = np.abs(data).mean()

        with open(log_path, "a") as log:
            if audio_volume > 500:
                log.write(
                    f"{timestamp} - ALERT: Non-silent audio detected (volume={audio_volume})\n"
                )
            else:
                log.write(
                    f"{timestamp} - OK: Silent background (volume={audio_volume})\n"
                )

        r = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio = r.record(source)
            try:
                text = r.recognize_google(audio)
                with open(log_path, "a") as log:
                    log.write(f'{timestamp} - ALERT: Speech detected - "{text}"\n')
            except sr.UnknownValueError:
                with open(log_path, "a") as log:
                    log.write(f"{timestamp} - OK: No intelligible speech detected\n")

    except Exception as e:
        with open(log_path, "a") as log:
            log.write(f"{timestamp} - ERROR: Audio processing error: {str(e)}\n")

    return "Audio processed and analyzed", 200


@main.route("/log_event", methods=["POST"])
def log_event():
    data = request.json
    with open(os.path.join(UPLOAD_FOLDER, "events.log"), "a") as f:
        f.write(f"{data['time']} - {data['event']}\n")
    return "Logged", 200
