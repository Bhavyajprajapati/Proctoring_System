// import React, { useState, useEffect, useRef } from "react";
// import Questions from "./Questions";
// import { startProctoring, sendReferencePhoto } from "../components/Proctoring";

// const SkillForm = () => { 
//   const [skill, setSkill] = useState("");
//   const [totalQuestions, setTotalQuestions] = useState("");
//   const [totalTime, setTotalTime] = useState("");
//   const [show, setShow] = useState(false);
//   const [photoCaptured, setPhotoCaptured] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
//   const [capturedImage, setCapturedImage] = useState(null); // ✅ new state

//   const videoRef = useRef(null);
//   const streamRef = useRef(null); // ✅ for later stopping

//   useEffect(() => {
//     navigator.mediaDevices
//       .getUserMedia({ video: true })
//       .then((stream) => {
//         videoRef.current.srcObject = stream;
//         streamRef.current = stream;
//       })
//       .catch((err) => {
//         console.error("Webcam access error:", err);
//         alert("Please allow webcam access to proceed.");
//       });

//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, []);

//   const handlePhotoCapture = async () => {
//     setIsUploading(true);

//     await sendReferencePhoto(
//       async (blob) => {
//         // ✅ Stop webcam after capture
//         if (streamRef.current) {
//           streamRef.current.getTracks().forEach((track) => track.stop());
//         }

//         // ✅ Show captured image
//         const imageURL = URL.createObjectURL(blob);
//         setCapturedImage(imageURL);

//         setPhotoCaptured(true);
//         setIsUploading(false);
//       },
//       () => {
//         setIsUploading(false);
//         alert("Failed to capture photo.");
//       }
//     );
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (
//       skill.trim() === "" ||
//       totalQuestions <= 0 ||
//       totalTime <= 0 ||
//       isNaN(totalQuestions) ||
//       isNaN(totalTime)
//     ) {
//       alert("Please enter valid inputs.");
//       return;
//     }

//     setShow(true);
//     startProctoring();
//   };

//   return show ? (
//     <Questions
//       skill={skill}
//       totalQuestions={totalQuestions}
//       totalTime={totalTime}
//     />
//   ) : (
//     <section className="container mx-auto mt-4 w-full h-screen flex items-center justify-center bg-white">
//       <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
//         <h2 className="text-2xl font-bold text-center mb-4 text-gray-700">
//           Capture Your Reference Photo
//         </h2>

//         <div className="mb-4 text-center">
//           {capturedImage ? (
//             <img
//               src={capturedImage}
//               alt="Captured Reference"
//               className="rounded w-full h-64 object-cover border"
//             />
//           ) : (
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               className="rounded w-full h-64 object-cover border"
//             />
//           )}

//           {!photoCaptured && (
//             <button
//               onClick={handlePhotoCapture}
//               disabled={isUploading}
//               className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//             >
//               {isUploading ? "Uploading..." : "Capture & Upload Photo"}
//             </button>
//           )}
//         </div>

//         <form className="flex flex-col space-y-6" onSubmit={handleSubmit}>
//           <label className="block">
//             <span className="text-gray-700 font-semibold">Enter a Skill</span>
//             <input
//               type="text"
//                                 placeholder="Enter a skill (e.g., Java, C++, Python)"

//               className="mt-2 border border-gray-300 rounded-lg py-3 px-4 w-full"
//               value={skill}
//               onChange={(e) => setSkill(e.target.value)}
//             />
//           </label>
//           <label className="block">
//             <span className="text-gray-700 font-semibold">Total Questions</span>
//             <input
//               type="number"
//                                 placeholder="Total number of questions"

//               className="mt-2 border border-gray-300 rounded-lg py-3 px-4 w-full"
//               value={totalQuestions}
//               onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
//             />
//           </label>
//           <label className="block">
//             <span className="text-gray-700 font-semibold">
//               Total Time (minutes)
//             </span>
//             <input
//               type="number"
//                                 placeholder="Total time (minutes)"

//               className="mt-2 border border-gray-300 rounded-lg py-3 px-4 w-full"
//               value={totalTime}
//               onChange={(e) => setTotalTime(parseInt(e.target.value))}
//             />
//           </label>
//           <button
//             type="submit"
//             disabled={!photoCaptured}
//             className={`py-3 px-6 rounded-lg shadow-lg text-white transition ${
//               photoCaptured
//                 ? "bg-blue-500 hover:bg-blue-600"
//                 : "bg-gray-400 cursor-not-allowed"
//             }`}
//           >
//             Start Test
//           </button>
//         </form>
//       </div>
//     </section>
//   );
// };

// export default SkillForm;
import React, { useState, useEffect, useRef } from "react";
import Questions from "./Questions";
import { startProctoring, sendReferencePhoto } from "../components/Proctoring";

const SkillForm = () => {
  const [skill, setSkill] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [show, setShow] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [useUpload, setUseUpload] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!useUpload) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        })
        .catch((err) => {
          console.error("Webcam access error:", err);
          alert("Please allow webcam access or upload an image manually.");
        });

      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }
  }, [useUpload]);

  const handlePhotoCapture = async () => {
    setIsUploading(true);
    await sendReferencePhoto(
      async (blob) => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        const imageURL = URL.createObjectURL(blob);
        setCapturedImage(imageURL);
        setPhotoCaptured(true);
        setIsUploading(false);
      },
      () => {
        setIsUploading(false);
        alert("Failed to capture photo.");
      }
    );
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    setUseUpload(true);
    setIsUploading(true);

    const imageURL = URL.createObjectURL(file);
    setCapturedImage(imageURL);
    setPhotoCaptured(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/save-id-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Upload failed");
      }
    } catch (err) {
      alert("Failed to upload the image.");
      setPhotoCaptured(false);
    }

    setIsUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      skill.trim() === "" ||
      totalQuestions <= 0 ||
      totalTime <= 0 ||
      isNaN(totalQuestions) ||
      isNaN(totalTime)
    ) {
      alert("Please enter valid inputs.");
      return;
    }

    setShow(true);
    startProctoring();
  };

  return show ? (
    <Questions
      skill={skill}
      totalQuestions={totalQuestions}
      totalTime={totalTime}
    />
  ) : (
    <section className="container mx-auto mt-4 w-full h-screen flex items-center justify-center bg-white">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-700">
          Provide Your ID Photo
        </h2>

        <div className="mb-4 text-center">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured or Uploaded ID"
              className="rounded w-full h-64 object-cover border"
            />
          ) : !useUpload ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="rounded w-full h-64 object-cover border"
            />
          ) : null}

          {!photoCaptured && (
            <div className="flex flex-col items-center gap-4 mt-4">
              <button
                onClick={handlePhotoCapture}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {isUploading ? "Uploading..." : "Capture & Upload from Webcam"}
              </button>

              <p className="text-sm text-gray-600">or</p>

              <input
                type="file"
                accept="image/jpeg, image/jpg, image/png"
                onChange={handleUpload}
                className="text-sm"
              />
            </div>
          )}
        </div>

        <form className="flex flex-col space-y-6" onSubmit={handleSubmit}>
          <label>
            <span className="text-gray-700 font-semibold">Enter a Skill</span>
            <input
              type="text"
              placeholder="Skill (e.g., Java, Python)"
              className="mt-2 border border-gray-300 rounded-lg py-3 px-4 w-full"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
          </label>
          <label>
            <span className="text-gray-700 font-semibold">Total Questions</span>
            <input
              type="number"
              placeholder="Number of Questions"
              className="mt-2 border border-gray-300 rounded-lg py-3 px-4 w-full"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
            />
          </label>
          <label>
            <span className="text-gray-700 font-semibold">
              Total Time (minutes)
            </span>
            <input
              type="number"
              placeholder="Time in minutes"
              className="mt-2 border border-gray-300 rounded-lg py-3 px-4 w-full"
              value={totalTime}
              onChange={(e) => setTotalTime(parseInt(e.target.value))}
            />
          </label>
          <button
            type="submit"
            disabled={!photoCaptured}
            className={`py-3 px-6 rounded-lg shadow-lg text-white transition ${
              photoCaptured
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Start Test
          </button>
        </form>
      </div>
    </section>
  );
};

export default SkillForm;