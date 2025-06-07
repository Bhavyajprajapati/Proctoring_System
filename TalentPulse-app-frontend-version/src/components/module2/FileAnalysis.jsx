import React, { useState } from "react";
import GenerateTest from "./GenerateTest";
import { Loader, Upload, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


const FileAnalysis = ({ fileAnalysis }) => {
  console.log(fileAnalysis);
  
  const [generatedTest, setGeneratedTest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState({});
  const [error, setError] = useState(null);

  const handleTopicSelection = (topic, subtopic, value) => {
    setSelectedTopics((prev) => ({
      ...prev,
      [topic]: {
        ...prev[topic],
        [subtopic]: parseInt(value) || 0,
      },
    }));
  };

  const handleGenerateTest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/generate-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedTopics }),
      });

      if (!response.ok) {
        throw new Error("Test generation failed");
      }

      const data = await response.json();
      setGeneratedTest(data);
    } catch (error) {
      setError("An error occurred while generating the test.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (generatedTest) {
    return <GenerateTest generatedTest={generatedTest} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex justify-center items-center p-4"
    >
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-indigo-700 text-center">
          Generate Your Custom Test
        </h1>
        <p className="text-xl text-gray-600 text-center mb-8">
          Total Questions Available:{" "}
          <span className="text-indigo-600 font-semibold">
            {fileAnalysis.totalQuestions}
          </span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {Object.entries(fileAnalysis.topics).map(([topic, subtopics]) => (
            <motion.div
              key={topic}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-indigo-50 p-6 rounded-xl shadow-md"
            >
              <h3 className="text-2xl font-semibold text-indigo-800 mb-4">
                {topic}
              </h3>
              {Object.entries(subtopics).map(([subtopic, count]) => (
                <div key={subtopic} className="flex items-center justify-between mb-3">
                  <span className="text-gray-700">
                    {subtopic} <span className="text-indigo-600 font-medium">({count})</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={count}
                    className="w-20 px-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    onChange={(e) =>
                      handleTopicSelection(topic, subtopic, e.target.value)
                    }
                  />
                </div>
              ))}
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerateTest}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all duration-300 text-xl shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader className="animate-spin mr-2" />
          ) : (
            <Upload className="mr-2" />
          )}
          {isLoading ? "Generating Test..." : "Generate Test"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FileAnalysis;