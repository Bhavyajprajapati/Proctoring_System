import React, { useState } from "react";
import { Upload, Loader, FileText, AlertCircle } from "lucide-react"; // Replaced FileAnalysis with FileText
import FileAnalysis from "./module2/FileAnalysis";
import GenerateTest from "./module2/GenerateTest";

const QuestionUploadAnalysis = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setFileAnalysis(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/analyze-file", {
        method: "POST",
        body: formData,
        withCredentials : true
      });

      console.log(response);

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      const data = await response.json();
      setFileAnalysis(data);
    } catch (error) {
      setError("An error occurred while uploading and analyzing the file.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {fileAnalysis ? (
        <FileAnalysis fileAnalysis={fileAnalysis} />
      ) : (
        <div className="w-full h-screen flex justify-center items-center">
          <div className=" bg-white rounded-lg shadow-lg p-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
              Upload a Questions File
            </h1>
            <div className="bg-indigo-50 rounded-md p-4 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                Please upload a CSV or Excel file with the following fields:{" "}
                <span className="text-violet-800 font-semibold">
                  ID, Topic, Subtopic, Question, Option A-D, Correct Answer,
                  Difficulty, and Marks
                </span>{" "}
                <span>(Explanation, Time Limit, and Tags are optional).</span>
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
              >
                <span className="flex items-center space-x-2">
                  <Upload className="w-6 h-6 text-gray-600" />
                  <span className="font-medium text-gray-600">
                    {file ? file.name : "Drop files to Attach, or browse"}
                  </span>
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={isLoading || !file}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md font-semibold transition duration-300 ease-in-out hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <Loader className="animate-spin mr-2" />
              ) : (
                <Upload className="mr-2" />
              )}
              {isLoading ? "Analyzing..." : "Upload and Analyze"}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
                <AlertCircle className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionUploadAnalysis;
