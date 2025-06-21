from flask import Blueprint, request
from controller.proctoring import (
    save_snapshot,
    check_blink,
    mic_audio,
    log_event,
    save_evidence,
    save_id_photo,
)

proctoring_routes = Blueprint("main", __name__)


@proctoring_routes.route("/snapshot", methods=["POST"])
def snapshot():
    return save_snapshot()


@proctoring_routes.route("/mic-audio", methods=["POST"])
def mic_audio_route():
    return mic_audio()


@proctoring_routes.route("/log_event", methods=["POST"])
def log_event_route():
    return log_event()


@proctoring_routes.route("/check_blink", methods=["POST"])
def check_blink_route():
    return check_blink()


@proctoring_routes.route("//save-id-photo", methods=["POST"])
def save_id_photo_route():
    return save_id_photo()


@proctoring_routes.route("/recorded-evidence", methods=["POST"])
def save_evidence_route():
    return save_evidence()
