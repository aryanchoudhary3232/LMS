import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../css/student/Quiz.css";
import useLearningTimer from "../../helper/customHooks/useLearningTimer";

const Quiz = () => {
  const { courseId, chapterId, topicId } = useParams();

  const token = localStorage.getItem("token");

  const [quiz, setQuiz] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [answerQuiz, setAnswerQuiz] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [result, setResult] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { startTimer, stopTimer, seconds, isActive, formattedTime } = useLearningTimer();

  useEffect(() => {
    startTimer();

    return () => stopTimer();
  }, []);

  useEffect(() => {
    async function getCourseById() {
      try {
        const backendUrl =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        const response = await fetch(
          `${backendUrl}/student/courses/${courseId}`
        );
        const courseResponse = await response.json();

        if (response.ok && courseResponse.success) {
          const chapter = courseResponse.data.chapters.find(
            (chapter) => chapter._id === chapterId
          );
          const topic = chapter.topics.find((topic) => topic._id === topicId);
          setQuiz(topic.quiz);

          setQuizTitle(courseResponse.data.title);
        } else {
          console.error(
            "Error fetching course for quiz:",
            courseResponse.message
          );
        }
      } catch (error) {
        console.log("err occurred..", error);
      }
    }

    getCourseById();
  }, [courseId, chapterId, topicId]);


  const handleTickOption = (questionIdx, option) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIdx] = option;
      return newAnswers;
    });
    setAnswerQuiz((prev) => {
      const updated = prev.filter(
        (ans) => ans.question !== quiz[questionIdx].question
      );
      return [
        ...updated,
        { question: quiz[questionIdx].question, tickOption: option },
      ];
    });
  };


  const handleOnSubmit = async (e) => {
    e.preventDefault();

    const bodyData = {
      courseId,
      chapterId,
      topicId,
      answerQuiz,
    };
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/student/quiz_submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      setResult(data.data);
      setIsSubmitted(true);
    }
  };

  return !isSubmitted ? (
    <div
      style={{ display: "flex", flexDirection: "column", marginTop: "22px" }}
    >
      {/* Learning Timer Indicator */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        backgroundColor: isActive ? "#dbeafe" : "#f3f4f6",
        borderRadius: "8px",
        marginBottom: "20px",
        maxWidth: "400px",
        margin: "0 auto 20px auto",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}>
        <span style={{ fontSize: "1.2rem" }}>
          {isActive ? "🧠" : "⏸️"}
        </span>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
        }}>
          <span style={{
            fontWeight: "600",
            fontSize: "1rem",
            color: isActive ? "#1e40af" : "#6b7280",
          }}>
            Study Time: {formattedTime}
          </span>
          <span style={{
            fontSize: "0.8rem",
            color: isActive ? "#3730a3" : "#9ca3af",
            fontStyle: "italic",
          }}>
            {isActive ? "Focus mode active" : "Timer paused"}
          </span>
        </div>
      </div>


      <h2 style={{ textAlign: "center" }}>Topic: {quizTitle}</h2>

      {/* Progress Indicator */}
      {quiz.length > 0 && (
        <div style={{
          textAlign: "center",
          marginBottom: "16px",
          color: "#666",
          fontSize: "14px"
        }}>
          Question {currentQuestionIndex + 1} of {quiz.length}
          <div style={{
            width: "200px",
            height: "6px",
            background: "#e5e7eb",
            borderRadius: "3px",
            margin: "8px auto 0",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%`,
              height: "100%",
              background: "#2337ad",
              borderRadius: "3px",
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>
      )}

      <form
        onSubmit={handleOnSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 12px rgba(0,0,0,0.2)",
          borderRadius: "8px",
          width: "50%",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "24px",
          minHeight: "300px"
        }}
      >
        {quiz.length > 0 && (
          <div style={{ marginBottom: "15px", flex: 1 }}>
            <div style={{ fontWeight: "600", marginBottom: "16px", fontSize: "18px" }}>
              Q{currentQuestionIndex + 1}:&nbsp;{quiz[currentQuestionIndex].question}
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexDirection: "column",
              }}
            >
              {quiz[currentQuestionIndex].options.map((option, optionIdx) => (
                <div
                  key={optionIdx}
                  onClick={() => handleTickOption(currentQuestionIndex, option)}
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    padding: "12px 16px",
                    border: userAnswers[currentQuestionIndex] === option
                      ? "2px solid #2337ad"
                      : "1px solid #d1d5db",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: userAnswers[currentQuestionIndex] === option
                      ? "#eef2ff"
                      : "white",
                    transition: "all 0.2s ease"
                  }}
                >
                  <input
                    onChange={() => handleTickOption(currentQuestionIndex, option)}
                    checked={userAnswers[currentQuestionIndex] === option}
                    name={`question-${currentQuestionIndex}`}
                    type="radio"
                    style={{ cursor: "pointer" }}
                  />
                  <div style={{ fontSize: "15px" }}>{option}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid #e5e7eb"
        }}>
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            style={{
              padding: "10px 24px",
              background: currentQuestionIndex === 0 ? "#e5e7eb" : "#f3f4f6",
              color: currentQuestionIndex === 0 ? "#9ca3af" : "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer",
              fontWeight: "500"
            }}
          >
            ← Previous
          </button>

          {currentQuestionIndex < quiz.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.length - 1, prev + 1))}
              style={{
                padding: "10px 24px",
                background: "#2337ad",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              style={{
                padding: "10px 24px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              ✓ Finish Quiz
            </button>
          )}
        </div>
      </form>
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 0 6px rgba(0,0,0,0.2)",
        width: "50vw",
        margin: "44px auto",
        borderRadius: "6px",
      }}
    >
      <h2>🎉 Quiz Result</h2>
      <div
        style={{
          boxShadow: "0 0 5px rgba(0,0,0,0.2)",
          background: "rgb(230 232 241)",
          width: "80%",
          textAlign: "center",
          padding: "14px 0px",
          fontWeight: 600,
          borderRadius: "5px",
          marginBottom: "17px",
          fontSize: "21px",
        }}
      >
        Your Score:{" "}
        <span style={{ color: "green" }}>
          {" "}
          {result.score} ({result.correct}/{result.totalQuestions}) correct
        </span>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {result?.quiz?.map((q, qidx) => (
          <div
            key={qidx}
            className={q.tickOption === q.correctOption ? "green" : ""}
            style={{
              boxShadow: "0 0 5px rgba(0,0,0,0.2)",
              padding: "4px 5px",
              width: "79%",
              marginBottom: "11px",
              borderRadius: "5px",
            }}
          >
            <div style={{ marginBottom: "13px" }}>
              {q.tickOption === q.correctOption ? "✅" : "❌"}{" "}
              <span style={{ marginLeft: "12px", fontWeight: 600 }}>
                Q{qidx + 1}.{q.questionText}
              </span>
            </div>
            <div
              className=""
              style={{
                marginBottom: "9px",
                marginLeft: "33px",
              }}
            >
              <span style={{ fontWeight: "600" }}>Your Answer: </span>
              {q.tickOption}
            </div>
            <div
              className=""
              style={{ marginBottom: "9px", marginLeft: "33px" }}
            >
              <span style={{ fontWeight: "600" }}>Correct Answer:</span>{" "}
              {q.correctOption}
            </div>
            <div
              className=""
              style={{ marginBottom: "9px", marginLeft: "33px" }}
            >
              <span style={{ fontWeight: "600" }}>Explanation:</span>{" "}
              {q.explaination}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quiz;
