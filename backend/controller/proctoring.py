import os
import datetime
import subprocess
from flask import Blueprint, request, jsonify
import cv2
import mediapipe as mp
from ultralytics import YOLO
import numpy as np
from scipy.io import wavfile
import speech_recognition as sr
import face_recognition

UPLOAD_FOLDER = os.path.join(os.getcwd(), "static/uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load YOLOv8 model once (will download if not present)
yolo_model = YOLO("yolov8n.pt")


def log_event():
    data = request.json
    with open(os.path.join(UPLOAD_FOLDER, "events.log"), "a") as f:
        f.write(f"{data['time']} - {data['event']}\n")
    return "Logged", 200


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


def check_blink():
    from math import dist

    def calculate_EAR(eye_points):
        # EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
        vertical1 = dist(eye_points[1], eye_points[5])
        vertical2 = dist(eye_points[2], eye_points[4])
        horizontal = dist(eye_points[0], eye_points[3])
        return (vertical1 + vertical2) / (2.0 * horizontal)

    # Eye landmarks from MediaPipe (LEFT and RIGHT)
    LEFT_EYE_IDX = [33, 160, 158, 133, 153, 144]
    RIGHT_EYE_IDX = [362, 385, 387, 263, 373, 380]
    EAR_THRESHOLD = 0.21  # Below this is considered closed/blink

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
        return jsonify({"status": "error", "message": "No face detected"}), 200

    face_landmarks = results.multi_face_landmarks[0]
    img_h, img_w = image.shape[:2]

    # Convert normalized landmarks to pixel coordinates
    landmarks = [
        (int(lm.x * img_w), int(lm.y * img_h)) for lm in face_landmarks.landmark
    ]

    left_eye = [landmarks[i] for i in LEFT_EYE_IDX]
    right_eye = [landmarks[i] for i in RIGHT_EYE_IDX]

    left_EAR = calculate_EAR(left_eye)
    right_EAR = calculate_EAR(right_eye)
    avg_EAR = (left_EAR + right_EAR) / 2.0

    if avg_EAR < EAR_THRESHOLD:
        return (
            jsonify({"status": "success", "message": "Blink detected", "EAR": avg_EAR}),
            200,
        )
    else:
        return (
            jsonify({"status": "success", "message": "Eyes open", "EAR": avg_EAR}),
            200,
        )


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

        labels = [r for r in results[0].names.values()]
        detected = results[0].boxes.cls.tolist()
        suspicious_labels = [labels[int(cls)] for cls in detected]

        with open(log_path, "a") as log:
            if phone_detected:
                log.write(f"{timestamp} - ALERT: Phone detected in {filename}\n")
                return jsonify({"suspicious": True, "reason": "Phone Detected"})

        # Face recognition steps
        image = face_recognition.load_image_file(path)
        face_encodings = face_recognition.face_encodings(image)

        with open(log_path, "a") as log:
            if len(face_encodings) == 0:
                log.write(f"{timestamp} - ALERT: No face detected in {filename}\n")
                # return "No face detected", 200
                return jsonify({"suspicious": True, "reason": "No face detected"})

            if len(face_encodings) > 1:
                log.write(
                    f"{timestamp} - ALERT: Multiple faces detected in {filename}\n"
                )
                # return "Multiple faces detected", 200
                return jsonify(
                    {"suspicious": True, "reason": "Multiple faces detected"}
                )

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
                return jsonify({"suspicious": True, "reason": "Face Mismatch"})

            for item in suspicious_labels:
                if item.lower() in ["remote", "tv", "book", "handbag"]:
                    log.write(f"{timestamp} - ALERT: {item} detected in {filename}\n")
                    return jsonify({"suspicious": True, "reason": item})

    except Exception as e:
        with open(log_path, "a") as log:
            log.write(
                f"{timestamp} - ERROR: Exception during snapshot processing: {str(e)}\n"
            )
        return f"Error processing snapshot: {e}", 500

    return "Snapshot processed", 200


def save_reference_photo():
    snapshot = request.files.get("snapshot")
    if not snapshot:
        return "No snapshot provided", 400

    reference_path = os.path.join(UPLOAD_FOLDER, "reference.jpg")
    snapshot.save(reference_path)

    return (
        jsonify(
            {"status": "success", "message": "Reference Photo is saved successfully"}
        ),
        200,
    )


def save_evidence():
    file = request.files.get("evidence")
    if not file:
        return "No file received", 400

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    video_path = os.path.join(UPLOAD_FOLDER, f"evidence_{timestamp}.mp4")
    file.save(video_path)

    with open(os.path.join(UPLOAD_FOLDER, "events.log"), "a") as log:
        log.write(
            f"{timestamp} - ALERT: Suspicious activity video saved: {video_path}\n"
        )

    return "Video evidence saved", 200
