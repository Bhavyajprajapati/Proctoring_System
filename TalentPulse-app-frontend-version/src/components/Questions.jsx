import React, { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";
import Result from "./Result";
import styles from "./Questions.module.css";
import { stopProctoring } from "../components/Proctoring";

const Questions = ({ skill, totalQuestions, totalTime }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForLater, setMarkedForLater] = useState([]);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [scorePercentage, setScorePercentage] = useState(0);
  const [marksScored, setMarksScored] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(totalTime * 60); // Convert minutes to seconds
  const [isTimeStarted, setIsTimeStarted] = useState(false); // flag to indicate if timer should start

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/questions?skill=${skill}&totalQuestions=${totalQuestions}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(response);
        const data = await response.json();
        console.log(data);
        const questionsArray = Array.isArray(data.questions)
          ? data.questions.slice(0, totalQuestions)
          : [];

        setQuestions(questionsArray);
        setTotalMarks(questionsArray.length);
        setIsTimeStarted(true);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setQuestions([]);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [skill, totalQuestions]);

  useEffect(() => {
    if (!isTimeStarted) return; // Prevent the timer from starting until questions are loaded

    if (timeLeft === 0) {
      handleSubmit();
    }
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isTimeStarted]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleOptionChange = (questionIndex, option) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionIndex]: option,
    }));
  };

  const calculateScore = () => {
    let correctAnswers = 0;

    questions.forEach((question, index) => {
      if (answers[index] === question.answer) {
        correctAnswers += 1;
      }
    });

    const scorePercentage = ((correctAnswers / questions.length) * 100).toFixed(
      2
    );
    let rating = "";
    if (scorePercentage >= 90) rating = "Expert";
    else if (scorePercentage >= 70) rating = "Master";
    else if (scorePercentage >= 50) rating = "Learning";
    else if (scorePercentage >= 30) rating = "Beginner";
    else rating = "Needs Improvement";

    setScorePercentage(scorePercentage);

    return { correctAnswers, scorePercentage, rating };
  };

  const handleSubmit = () => {
    const { correctAnswers, scorePercentage, rating } = calculateScore();
    setMarksScored(correctAnswers);
    setScorePercentage(scorePercentage);
    setRating(rating);
    setShowResult(true);
    stopProctoring();
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
  };

  const handleMarkForLater = () => {
    if (!markedForLater.includes(currentQuestionIndex)) {
      setMarkedForLater((prev) => [...prev, currentQuestionIndex]);
    }
  };

  const navigateToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-3xl">Loading...</div>
        <span className={styles["loader"]}></span>
      </div>
    );
  }

  if (showResult) {
    return (
      <Result
        scorePercentage={scorePercentage}
        rating={rating}
        marksScored={marksScored}
        totalMarks={totalMarks}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  //const currentQuestion = questions

  return (
    <>
      <div className={`${styles["questionDiv"]} p-4 mt-8`}>
        {error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : (
          <>
            <div>
              {/* Question Section */}
              <div className="flex justify-between mb-4">
                <h4 className="font-bold">
                  {currentQuestionIndex + 1}. {currentQuestion.question}
                </h4>
                <div className="text-red-500 font-bold">
                  Time Left: {formatTime(timeLeft)}
                </div>
              </div>

              {/* Code Block (if code exists) */}
              {currentQuestion.code && (
                <div className="mb-4">
                  <SyntaxHighlighter language="java" style={coy}>
                    {currentQuestion.code}
                  </SyntaxHighlighter>
                </div>
              )}

              {/* Difficulty Level */}
              <div className="mb-2">
                <span className="font-semibold">Difficulty: </span>
                {currentQuestion.difficulty === "Easy" ? (
                  <span className="text-green-500">
                    {currentQuestion.difficulty}
                  </span>
                ) : currentQuestion.difficulty === "Medium" ? (
                  <span className="text-yellow-500">
                    {currentQuestion.difficulty}
                  </span>
                ) : (
                  <span className="text-red-500">
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>

              {/* BT-Level*/}
              <div className="mb-2">
                <span className="font-semibold">BT_Level: </span>
                <span className="text-green-500">
                  {currentQuestion.BT_level}
                </span>
              </div>

              {/* Options */}
              {currentQuestion.options.map((option, idx) => (
                <div key={idx} className={styles["optionItem"]}>
                  <input
                    type="radio"
                    id={`question-${currentQuestionIndex}-option-${idx}`}
                    name={`question-${currentQuestionIndex}`}
                    value={option}
                    checked={answers[currentQuestionIndex] === option}
                    onChange={() =>
                      handleOptionChange(currentQuestionIndex, option)
                    }
                  />
                  <label
                    htmlFor={`question-${currentQuestionIndex}-option-${idx}`}
                    className="ml-2"
                  >
                    {option}
                  </label>
                </div>
              ))}

              {/* Centered Navigation Buttons */}
              <div className="mt-4 flex justify-center items-center">
                <button
                  onClick={handlePrevious}
                  className={`p-2 bg-gray-500 text-white rounded mr-2 ${
                    currentQuestionIndex === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </button>

                <button
                  onClick={handleMarkForLater}
                  className={`p-2 rounded mx-2 ${
                    markedForLater.includes(currentQuestionIndex)
                      ? "bg-yellow-500 text-white" // Bright yellow when marked
                      : "bg-yellow-300 text-white opacity-75" // Faded yellow when not marked
                  }`}
                >
                  {markedForLater.includes(currentQuestionIndex)
                    ? "Marked for Later"
                    : "Mark as View Later"}
                </button>

                <button
                  onClick={handleNext}
                  className={`p-2 bg-blue-500 text-white rounded ml-2 ${
                    currentQuestionIndex === questions.length - 1
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                </button>
              </div>

              {/* Footer Navigation Bar */}
              <div className="mt-4">
                <div className="flex flex-wrap justify-center">
                  {questions.map((_, index) => {
                    const isAnswered = answers.hasOwnProperty(index);
                    const isMarkedForLater = markedForLater.includes(index);
                    return (
                      <button
                        key={index}
                        role="button"
                        onClick={() => navigateToQuestion(index)}
                        className={`m-2 p-2 rounded-md border border-slate-300 py-2 px-4 text-center text-sm transition-all shadow-sm text-slate-600 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none ${
                          currentQuestionIndex === index
                            ? "bg-blue-500 text-white"
                            : isMarkedForLater
                            ? "bg-red-500 text-white"
                            : isAnswered
                            ? "bg-green-500 text-white"
                            : "bg-gray-300"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex justify-center">
                <div className="text-sm">
                  <span className="mr-4">
                    <span className="p-1 bg-green-500 text-white rounded-full inline-block w-4 h-4"></span>{" "}
                    Answered
                  </span>
                  <span className="mr-4">
                    <span className="p-1 bg-red-500 text-white rounded-full inline-block w-4 h-4"></span>{" "}
                    Marked for Later
                  </span>
                  <span>
                    <span className="p-1 bg-gray-300 rounded-full inline-block w-4 h-4"></span>{" "}
                    Unanswered
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="mt-8">
        <button
          onClick={handleSubmit}
          className="p-2 bg-green-500 text-white rounded mx-2"
        >
          Submit The Test
        </button>
      </div>
    </>
  );
};

export default Questions;
