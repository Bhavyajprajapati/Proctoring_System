import { useEffect, useState } from "react";

const TestResults = ({ generatedTest, userAnswers }) => {
    const [overallScore, setOverallScore] = useState(0);
    const [categoryScores, setCategoryScores] = useState({});
    const [topicScores, setTopicScores] = useState({});
  
    useEffect(() => {
      const results = generateResults(generatedTest, userAnswers);
      setOverallScore(results.overallScore);
      setCategoryScores(results.categoryScores);
      setTopicScores(results.topicScores);
    }, [generatedTest, userAnswers]);
  
    const generateResults = (test, answers) => {
      let totalCorrect = 0;
      const categoryCounts = {};
      const categoryCorrect = {};
      const topicCounts = {};
      const topicCorrect = {};
  
      test.forEach((question) => {
        const isCorrect = answers[question.id] === question.correct_answer;
        if (isCorrect) totalCorrect++;
  
        const category = `${question.topic} - ${question.subtopic}`;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        categoryCorrect[category] = (categoryCorrect[category] || 0) + (isCorrect ? 1 : 0);
  
        topicCounts[question.topic] = (topicCounts[question.topic] || 0) + 1;
        topicCorrect[question.topic] = (topicCorrect[question.topic] || 0) + (isCorrect ? 1 : 0);
      });
  
      const overallScore = (totalCorrect / test.length) * 100;
  
      const categoryScores = Object.keys(categoryCounts).reduce((acc, category) => {
        acc[category] = (categoryCorrect[category] / categoryCounts[category]) * 100;
        return acc;
      }, {});
  
      const topicScores = Object.keys(topicCounts).reduce((acc, topic) => {
        acc[topic] = (topicCorrect[topic] / topicCounts[topic]) * 100;
        return acc;
      }, {});
  
      return { overallScore, categoryScores, topicScores };
    };
  
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white py-4 px-6">
            <h1 className="text-2xl font-bold">Test Results</h1>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Overall Score</h2>
              <p className="text-3xl font-bold text-blue-600">{overallScore.toFixed(2)}%</p>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Topic Scores</h2>
              {Object.entries(topicScores).map(([topic, score]) => (
                <CategoryResult key={topic} category={topic} score={score} />
              ))}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Subtopic Scores</h2>
              {Object.entries(categoryScores).map(([category, score]) => (
                <CategoryResult key={category} category={category} score={score} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const CategoryResult = ({ category, score }) => {
    return (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg">{category}</h3>
        <div className="flex items-center mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${score}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-700">{score.toFixed(2)}%</span>
        </div>
      </div>
    );
  };


export default TestResults;