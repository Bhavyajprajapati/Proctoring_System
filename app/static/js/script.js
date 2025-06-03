let snapshotInterval = null;
let audioAnalyser = null;
let audioInterval = null;
let audioContext = null;
let mediaRecorder;
let recordedChunks = [];

async function recordAndSendAudio(durationSec = 3) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];

    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        fetch('/mic-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: blob
        });
        stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), durationSec * 1000);
}

async function startAudioSurveillance() {
    try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            console.warn('Web Audio API not supported');
            return;
        }
        audioContext = new AudioCtx();
        const micSource = audioContext.createMediaStreamSource(cameraStream);
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 2048;
        micSource.connect(audioAnalyser);

        const dataArray = new Uint8Array(audioAnalyser.fftSize);
        let noiseCount = 0;
        const MAX_NOISE_WARNINGS = 3;
        const NOISE_THRESHOLD = 4;

        audioInterval = setInterval(() => {
            audioAnalyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let v of dataArray) sum += (v - 128) ** 2;
            const rms = Math.sqrt(sum / dataArray.length);
            if (rms > NOISE_THRESHOLD) {
                noiseCount++;
                logEvent('background-noise: rms=' + rms.toFixed(2));
            }
            if (noiseCount >= MAX_NOISE_WARNINGS) {
                // logEvent('suspicious-audio-detected: count=' + noiseCount);
                // alert("Suspicious background noise detected. Please maintain silence.");
                recordAndSendAudio(); // <--- This line
                noiseCount = 0;
            }
        }, 1000);

    } catch (err) {
        console.error('Audio surveillance error:', err);
    }
}

function stopAudioSurveillance() {
    if (audioInterval) {
        clearInterval(audioInterval);
        audioInterval = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    audioAnalyser = null;
}


function startProctoring(intervalInSec = 0.5) {
    requestFullscreen();
    startPeriodicSnapshots(intervalInSec);
    startAudioSurveillance(); // Start audio monitoring
    logEvent("Proctoring started");
}

function stopProctoring() {
    stopPeriodicSnapshots();
    stopAudioSurveillance(); // Stop audio monitoring
    exitFullscreen();
    logEvent("Proctoring stopped");
}

// Force fullscreen
function requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
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
// function startProctoring(intervalInSec = 0.5) {
//     requestFullscreen();
//     startPeriodicSnapshots(intervalInSec);
//     logEvent("Proctoring started");
// }

// // Stop Proctoring
// function stopProctoring() {
//     stopPeriodicSnapshots();
//     exitFullscreen();
//     logEvent("Proctoring stopped");
// }

// Snapshot Capture
function startPeriodicSnapshots(intervalInSec) {
    if (snapshotInterval) clearInterval(snapshotInterval);
    snapshotInterval = setInterval(() => {
        captureImage(blob => {
            const formData = new FormData();
            formData.append('snapshot', blob, 'snapshot.jpg');
            fetch('/snapshot', { method: 'POST', body: formData });
        });
    }, intervalInSec * 1000);
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
        (e.key === 'F11'),
        (e.key === 'esc'),
        (e.key === 'ESC'),
        (e.key === 'Escape'),
        (e.key === 'Tab' && e.altKey),
        (e.metaKey),
    ];
    if (blockedCombos.some(Boolean)) {
        e.preventDefault();
        logEvent(`Blocked key: ${e.key}`);
    }
});
