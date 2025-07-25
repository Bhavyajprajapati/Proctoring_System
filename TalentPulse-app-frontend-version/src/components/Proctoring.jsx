let suspiciousStream = null;
let suspiciousRecorder = null;
let suspiciousChunks = [];

let snapshotInterval = null;
let audioContext = null;
let audioAnalyser = null;
let audioInterval = null;
let recordedChunks = [];

let isProctoringActive = false;

// Handlers references so we can remove them later
function onContextMenu(e) {
  if (!isProctoringActive) return;
  e.preventDefault();
  logEvent("Blocked right-click");
}
function onCopy(e) {
  if (!isProctoringActive) return;
  e.preventDefault();
  logEvent("Blocked copy");
}
function onPaste(e) {
  if (!isProctoringActive) return;
  e.preventDefault();
  logEvent("Blocked paste");
}
function onCut(e) {
  if (!isProctoringActive) return;
  e.preventDefault();
  logEvent("Blocked cut");
}
function onKeyDown(e) {
  if (!isProctoringActive) return;
  const blockedCombos = [
    e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase()),
    e.ctrlKey && ["U", "S"].includes(e.key.toUpperCase()),
    e.key === "F12",
    e.key === "F11",
    e.key.toLowerCase() === "escape",
    e.key === "Tab" && e.altKey,
    e.metaKey,
  ];
  if (blockedCombos.some(Boolean)) {
    e.preventDefault();
    logEvent(`Blocked key: ${e.key}`);
  }
}

function enableRestrictions() {
  document.body.classList.add("proctoring-active");
  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("copy", onCopy);
  document.addEventListener("paste", onPaste);
  document.addEventListener("cut", onCut);
  document.addEventListener("keydown", onKeyDown);
}

function disableRestrictions() {
  document.body.classList.remove("proctoring-active");
  document.removeEventListener("contextmenu", onContextMenu);
  document.removeEventListener("copy", onCopy);
  document.removeEventListener("paste", onPaste);
  document.removeEventListener("cut", onCut);
  document.removeEventListener("keydown", onKeyDown);
}

// -------------- Suspicious video recording ----------------
function recordSuspiciousVideo(duration = 10) {
  if (!suspiciousStream) return;

  suspiciousChunks = [];
  suspiciousRecorder = new MediaRecorder(suspiciousStream, {
    mimeType: "video/webm",
  });

  suspiciousRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) suspiciousChunks.push(e.data);
  };

  suspiciousRecorder.onstop = () => {
    const blob = new Blob(suspiciousChunks, { type: "video/webm" });
    const formData = new FormData();
    formData.append("evidence", blob);

    fetch("http://localhost:5000/recorded-evidence", {
      method: "POST",
      body: formData,
    }).catch(console.error);

    suspiciousChunks = [];
  };

  suspiciousRecorder.start();
  setTimeout(() => suspiciousRecorder.stop(), duration * 1000);
}

// -------------- Start video stream and object detection --------------
async function startSurveillanceStream() {
  try {
    document.getElementById("surveillanceVideo").srcObject = suspiciousStream;
  } catch (err) {
    console.error("Error accessing webcam:", err);
  }
}

// -------------- Snapshot functionality ----------------

// const takeSnapshot = async () => {
//   if (!isProctoringActive) return;
//   try {
//     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     const videoTrack = stream.getVideoTracks()[0];
//     const imageCapture = new ImageCapture(videoTrack);
//     const blob = await imageCapture.takePhoto();

//     const formData = new FormData();
//     formData.append("snapshot", blob);

//     const res = await fetch("http://localhost:5000/snapshot", {
//       method: "POST",
//       body: formData,
//     });
//     const data = await res.json();

//     if (data.suspicious) {
//       console.warn("Suspicious activity detected:", data.reason);
//       recordSuspiciousVideo();
//       logEvent(`Suspicious video detected: ${data.reason}`);
//     }

//     videoTrack.stop();
//   } catch (err) {
//     console.error("Snapshot error:", err);
//   }
// };
const takeSnapshot = async () => {
  if (!isProctoringActive || !suspiciousStream) return;

  try {
    const videoTrack = suspiciousStream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(videoTrack);
    const blob = await imageCapture.takePhoto();

    const formData = new FormData();
    formData.append("snapshot", blob);

    const res = await fetch("http://localhost:5000/snapshot", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.suspicious) {
      console.warn("Suspicious activity detected:", data.reason);
      recordSuspiciousAV(10);
      logEvent(`Suspicious video detected: ${data.reason}`);
    }
  } catch (err) {
    console.error("Snapshot error:", err);
  }
};

const startPeriodicSnapshots = (intervalInSec = 4) => {
  if (!isProctoringActive) return;
  takeSnapshot(); // immediate first snapshot
  snapshotInterval = setInterval(takeSnapshot, intervalInSec * 1000);
};

const stopPeriodicSnapshots = () => {
  if (snapshotInterval) {
    clearInterval(snapshotInterval);
    snapshotInterval = null;
  }
};

// -------------- Audio recording & surveillance --------------
const recordAndSendAudio = async (durationSec = 10) => {
  if (!isProctoringActive) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];

    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      fetch("http://localhost:5000/mic-audio", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: blob,
      }).catch(console.error);
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), durationSec * 1000);
  } catch (error) {
    console.error("Audio recording error:", error);
  }
};

const startAudioSurveillance = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      console.warn("Web Audio API not supported");
      return;
    }
    audioContext = new AudioCtx();
    const micSource = audioContext.createMediaStreamSource(stream);
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 2048;
    micSource.connect(audioAnalyser);

    const dataArray = new Uint8Array(audioAnalyser.fftSize);
    let noiseCount = 0;

    const NOISE_THRESHOLD = 4;
    const MAX_NOISE_WARNINGS = 3;

    audioInterval = setInterval(() => {
      if (!isProctoringActive) return;
      audioAnalyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let v of dataArray) sum += (v - 128) ** 2;
      const rms = Math.sqrt(sum / dataArray.length);

      if (rms > NOISE_THRESHOLD) {
        recordSuspiciousAV(10);
        logEvent("Suspicious audio detected, recording audio.");
      }
      
      // if (noiseCount >= MAX_NOISE_WARNINGS) {
      //   noiseCount++;
      //   logEvent(`background-noise detected (RMS=${rms.toFixed(2)})`);
      //   noiseCount = 0;
      // }
    }, 2000); // every 10 seconds
  } catch (error) {
    console.error("Audio Surveillance Error:", error);
  }
};

const stopAudioSurveillance = async () => {
  if (audioInterval) {
    clearInterval(audioInterval);
    audioInterval = null;
  }
  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }
  audioAnalyser = null;
};

// -------------- Fullscreen management ----------------
function requestFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
  else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
}

async function exitFullscreen() {
  if (document.exitFullscreen) await document.exitFullscreen();
  else if (document.mozExitFullscreen) await document.mozExitFullscreen();
  else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
  else if (document.msExitFullscreen) await document.msExitFullscreen();
}

// -------------- Event logging ----------------
function logEvent(event) {
  if (!isProctoringActive) return;
  fetch("http://localhost:5000/log_event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: event, time: new Date().toISOString() }),
  }).catch(console.error);
}

// Prevent exiting fullscreen by forcing it back
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && isProctoringActive) {
    logEvent("Exited fullscreen - forcing fullscreen again");
    requestFullscreen();
  }
});

// Tab focus/blur logging
window.onblur = () => {
  logEvent("Tab/window lost focus");
  if (isProctoringActive && !document.fullscreenElement) {
    // Ask user to go fullscreen again
    // alert("You left the fullscreen. Please return to fullscreen mode.");
    requestFullscreen();
  }
};
window.onfocus = () => {
  logEvent("Tab/window gained focus");

  if (isProctoringActive && !document.fullscreenElement) {
    // Ask user to go fullscreen again
    // alert("You left the fullscreen. Please return to fullscreen mode.");
    requestFullscreen();
  }
};
window.onbeforeunload = () => logEvent("Page unload");

// Optional: prevent right-click
document.addEventListener("contextmenu", (e) => e.preventDefault());

// -------------- Main exported proctoring controls --------------
export const startProctoring = async (snapshotIntervalSec = 4) => {
  if (isProctoringActive) return;
  isProctoringActive = true;
  logEvent("Proctoring started");

  try {
    suspiciousStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
  } catch (err) {
    console.error("User denied AV permissions", err);
    alert("Audio and video permissions are required to start the test.");
    isProctoringActive = false;
    return;
  }

  requestFullscreen();

  await startSurveillanceStream();

  startPeriodicSnapshots(snapshotIntervalSec);

  await startAudioSurveillance();

  enableRestrictions();
};

export const stopProctoring = async () => {
  if (!isProctoringActive) return;
  logEvent("Proctoring stopped");
  isProctoringActive = false;

  stopPeriodicSnapshots();

  if (suspiciousStream) {
    suspiciousStream.getTracks().forEach((track) => track.stop());
    suspiciousStream = null;
  }

  await stopAudioSurveillance();
  await exitFullscreen();
  disableRestrictions();
};

export const sendReferencePhoto = async (onSuccess, onFail) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoTrack = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(videoTrack);

    const blob = await imageCapture.takePhoto();
    const formData = new FormData();
    formData.append("snapshot", blob, "reference.jpg");

    const res = await fetch("http://localhost:5000/save-id-photo", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    videoTrack.stop();

    if (data.status === "success") {
      onSuccess(blob);
    } else {
      onFail();
    }
  } catch (error) {
    console.error("Error sending reference photo:", error);
    onFail();
  }
};

let recordingInProgress = false;

async function recordSuspiciousAV(duration = 10) {
  if (!suspiciousStream || recordingInProgress) return;

  recordingInProgress = true;

  //video recording
  const chunks = [];

  const recorder = new MediaRecorder(suspiciousStream, {
    mimeType: "video/webm",
  });


  //audio recording
  const audioStream = new MediaStream(suspiciousStream.getAudioTracks());
  const audioChunks = [];
  const audioRecorder = new MediaRecorder(audioStream, {mimeType: "audio/webm",});

  
  //collecting the video
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  //collecting the audio
  audioRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  // api call to make video evidence
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const formData = new FormData();
    formData.append("evidence", blob);

    fetch("http://localhost:5000/recorded-evidence", {
      method: "POST",
      body: formData,
    }).catch(console.error);

    recordingInProgress = false;
  };

  // api call to analyze audio file recorded
  audioRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: "audio/webm"});
    fetch("http://localhost:5000/mic-audio", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: blob,
    }).catch(console.error);

    recordingInProgress = false;
  }

  await Promise.all([recorder.start(),audioRecorder.start()])
  // recorder.start();
  // audioRecorder.start();
  setTimeout(() => {
    if (recorder.state === "recording") recorder.stop();
    if (audioRecorder.state === "recording") audioRecorder.stop();
  }, duration * 1000);
}
