let snapshotInterval = null;

// Force fullscreen
function requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
}

// Exit fullscreen
function exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
}

// Detect if fullscreen is exited
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && snapshotInterval !== null) {
        logEvent('Exited fullscreen - forcing back');
        requestFullscreen();
    }
});

// Start Proctoring
function startProctoring(intervalInSec = 0.5) {
    requestFullscreen();
    startPeriodicSnapshots(intervalInSec);
    logEvent("Proctoring started");
}

// Stop Proctoring
function stopProctoring() {
    stopPeriodicSnapshots();
    exitFullscreen();
    logEvent("Proctoring stopped");
}

// Snapshot Capture
function startPeriodicSnapshots(intervalInSec) {
    if (snapshotInterval) clearInterval(snapshotInterval);
    snapshotInterval = setInterval(() => {
        captureImage(blob => {
            const formData = new FormData();
            formData.append('snapshot', blob, 'snapshot.jpg');
            fetch('/snapshot', { method: 'POST', body: formData });
        });
    }, intervalInSec * 100);
}

function stopPeriodicSnapshots() {
    if (snapshotInterval) {
        clearInterval(snapshotInterval);
        snapshotInterval = null;
    }
}

// Webcam capture function
function captureImage(callback) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            const canvas = document.createElement('canvas');
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                canvas.toBlob(blob => {
                    callback(blob);
                    stream.getTracks().forEach(track => track.stop());
                }, 'image/jpeg');
            };
        });
}

// Webcam preview
const webcamPreview = document.getElementById("webcamPreview");
if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            webcamPreview.srcObject = stream;
        })
        .catch(error => {
            console.error("Webcam error:", error);
        });
}

// Log event to server
function logEvent(event) {
    fetch('/log_event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: event, time: new Date().toISOString() })
    });
}

// Detect tab switch, focus loss
window.onblur = () => logEvent('Tab switch / window out of focus');
window.onfocus = () => logEvent('Window focused');
window.onbeforeunload = () => logEvent('Page unload');

// Prevent right-click, copy-paste, dev tools, etc.
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('keydown', function (e) {
    const blockedCombos = [
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())),
        (e.ctrlKey && ['U', 'S'].includes(e.key.toUpperCase())),
        (e.key === 'F12'),
        (e.key === 'Tab' && e.altKey),
        (e.metaKey),
    ];
    if (blockedCombos.some(Boolean)) {
        e.preventDefault();
        logEvent(`Blocked key: ${e.key}`);
    }
});
