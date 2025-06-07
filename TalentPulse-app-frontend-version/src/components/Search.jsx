import React, { useState } from "react";
import Questions from "./Questions";
import { startProctoring } from "../components/Proctoring";


const SkillForm = () => {
  const [skill, setSkill] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [show, setShow] = useState(false);

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

  return (
    <>
      {show ? (
        <Questions
          skill={skill}
          totalQuestions={totalQuestions}
          totalTime={totalTime}
        />
      ) : (
        <section className="container mx-auto mt-4 w-full h-screen flex items-center justify-center bg-white">
          <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
              Start Your Skill Test
            </h2>
            <form className="flex flex-col space-y-6" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-gray-700 font-semibold">
                  Enter a Skill
                </span>
                <input
                  type="text"
                  className="mt-2 form-input border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full shadow-sm"
                  placeholder="Enter a skill (e.g., Java, C++, Python)"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-gray-700 font-semibold">
                  Total Questions
                </span>
                <input
                  type="number"
                  className="mt-2 form-input border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full shadow-sm"
                  placeholder="Total number of questions"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                />
              </label>
              <label className="block">
                <span className="text-gray-700 font-semibold">
                  Total Time (minutes)
                </span>
                <input
                  type="number"
                  className="mt-2 form-input border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full shadow-sm"
                  placeholder="Total time (minutes)"
                  value={totalTime}
                  onChange={(e) => setTotalTime(parseInt(e.target.value))}
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Start Test
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
};

export default SkillForm; 
