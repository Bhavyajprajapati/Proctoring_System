import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import TestResults from "./TestResult";

const Test = ({ generatedTest }) => {
    console.log(generatedTest.questions);
    
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const options = ["A", "B", "C", "D"];

  const handleAnswer = (questionId, index) => {
    setUserAnswers((prev) => {
      if (prev[questionId] === options[index]) {
        const { [questionId]: _, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [questionId]: options[index] };
      }
    });
  };

  const navigateToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  const nextQuestion = () => {
    if (currentQuestion < generatedTest.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitTest = () => {
    setShowResults(true);
  };

  if (showResults) {
    return (
      <TestResults generatedTest={generatedTest} userAnswers={userAnswers} />
    );
  }

  const question = generatedTest[currentQuestion];

  console.log(question);
  

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-blue-600 text-white py-4 px-6">
          <h1 className="text-2xl font-bold">Generated Test</h1>
          <p className="text-sm">Total Questions: {generatedTest?.length}</p>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {generatedTest?.length}
            </span>
            <h2 className="text-xl font-semibold mt-2">{question?.question}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Topic: {question?.topic} - {question?.subtopic} | BT-Level:{" "}
              {question?.BT_Level}
            </p>
          </div>
          <div className="space-y-3">
            {question?.options.map((option, index) => (
              <motion.button
                key={index}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  userAnswers[question.id] === options[index]
                    ? "bg-blue-100 border-blue-500"
                    : "bg-gray-100 hover:bg-gray-200"
                } border flex justify-between items-center`}
                onClick={() => handleAnswer(question.id, index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{option}</span>
                {userAnswers[question.id] === options[index] && (
                  <Check className="text-blue-500" size={20} />
                )}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center">
          <button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="flex items-center text-blue-600 disabled:text-gray-400"
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          {currentQuestion === generatedTest.length - 1 ? (
            <button
              onClick={submitTest}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center text-blue-600"
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        <div className="bg-gray-200 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {generatedTest.map((_, index) => (
              <button
                key={index}
                onClick={() => navigateToQuestion(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  userAnswers[generatedTest[index].id]
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                } ${currentQuestion === index ? "ring-2 ring-blue-500" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
