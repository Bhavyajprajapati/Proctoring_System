# AI Proctoring System Setup Guide

This guide will help you set up the development environment for the AI Proctoring System using Python. It includes dependencies like `face_recognition`, `OpenCV`, `FFmpeg`, and speech/audio libraries.

---

## Step 1: Create Virtual Environment

```bash
python -m venv venv
```

Activate it:

* **Windows CMD**:

  ```bash
  venv\Scripts\activate
  ```
* **PowerShell**:

  ```bash
  .\venv\Scripts\Activate.ps1
  ```
* **Linux/macOS**:

  ```bash
  source venv/bin/activate
  ```

---

## Step 2: Ensure Python Version < 3.12

> 💝 Some packages (like `face_recognition`, `SpeechRecognition`, `mediapipe`, `torch`) are **not fully compatible with Python 3.12+**.

**Recommended Python version: `3.10.x` or `3.11.x`**

You can install an older Python version from [python.org](https://www.python.org/downloads/).

---

## Step 3: Install CMake + Visual Studio Build Tools (Windows Only)

`face_recognition` requires C++ compilation.

### 1. Install CMake

Download CMake: [https://cmake.org/download](https://cmake.org/download)

Make sure to **add CMake to PATH** during installation.

### 2. Install Visual Studio Build Tools

* Download: [https://visualstudio.microsoft.com/visual-cpp-build-tools/](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
* During installation, check:

  * ✅ **C++ build tools**
  * ✅ **Windows 10 SDK / 11 SDK**
  * ✅ **MSVC v14.x toolset**

---

## Step 4: Install FFmpeg (Required for Audio & Video Processing)

### Download the latest version:

From Gyan.dev official builds:
👉 [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/)

Download this:
`ffmpeg-release-essentials.zip` (or `.7z`)
**Current version:** `7.1.1` (released March 3, 2025)

### Add FFmpeg to System PATH:

1. Extract the folder (e.g., `ffmpeg-7.1.1-essentials_build`)
2. Copy the full path of the `bin` folder (e.g., `C:\ffmpeg\bin`)
3. Add this path to your environment variables under `Path`

Verify installation:

```bash
ffmpeg -version
```

---

## Step 5: Install Python Dependencies

Make sure your virtual environment is activated.

```bash
pip install -r requirements.txt
```

### Example `requirements.txt` (For Python < 3.12):

```txt
flask
face_recognition
opencv-python
mediapipe
ultralytics
torch
SpeechRecognition
```

---

## Final Check

```bash
python app.py
```

Make sure your application runs without errors.

---

## Tips

* If installing `dlib` or `face_recognition` fails on Windows, double-check that CMake and Build Tools are correctly installed and in your PATH.
* For issues with audio/video files, verify FFmpeg path with `ffmpeg -version`.

---

## Maintainers

Built for educational and AI-enhanced proctoring projects.
