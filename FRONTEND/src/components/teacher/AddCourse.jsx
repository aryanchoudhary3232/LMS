import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddCourse = () => {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "Beginner",
    duration: "",
    price: "",
    image: null,
    video: null,
    notes: null,
    teacher: "",
    chapters: [],
  });
  // Removed unused teacher/student search & lists to satisfy lint
  const [createFlashcards, setCreateFlashcards] = useState(false); // optional flashcard creation toggle
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // File size validation
    if (files && files[0]) {
      const file = files[0];
      const maxSize = name === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for others
      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          [name]:
            name === "video"
              ? "Video file must be less than 100MB"
              : "File must be less than 10MB",
        }));
        e.target.value = "";
        return;
      }
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Text-only validation for Title, Description, Category (no numbers allowed)
    if (["title", "description", "category"].includes(name)) {
      const hasNumbers = /[0-9]/.test(value);
      if (hasNumbers) {
        setErrors((prev) => ({
          ...prev,
          [name]: `${
            name.charAt(0).toUpperCase() + name.slice(1)
          } should contain only text, numbers are not allowed`,
        }));
        return; // Don't update the value if it contains numbers
      } else {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }

    // Number-only validation for Duration and Price
    if (["duration", "price"].includes(name)) {
      // Allow empty value for clearing the field
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          [name]: `${
            name.charAt(0).toUpperCase() + name.slice(1)
          } should contain only numbers`,
        }));
        return; // Don't update the value if it contains non-numbers
      } else {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }

    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleDeleteChapter = (chapterIdx) => {
    const newChapters = formData.chapters.filter(
      (_, idx) => idx !== chapterIdx
    );
    setFormData({ ...formData, chapters: newChapters });
  };

  const handleDeleteTopic = (chapterIdx, topicIdx) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIdx].topics = newChapters[chapterIdx].topics.filter(
      (_, idx) => idx !== topicIdx
    );
    setFormData({ ...formData, chapters: newChapters });
  };

  const handleDeleteQuestion = (chapterIdx, topicIdx, quizIdx) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIdx].topics[topicIdx].quiz = newChapters[
      chapterIdx
    ].topics[topicIdx].quiz.filter((_, idx) => idx !== quizIdx);
    setFormData({ ...formData, chapters: newChapters });
  };

  // (Potential future enhancement: allow selecting teacher/students here)

  const handleAddChapter = () => {
    setFormData({
      ...formData,
      chapters: [...formData.chapters, { title: "", topics: [] }],
    });
  };

  const handleAddTopic = (chapterIdx) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIdx] = {
      ...newChapters[chapterIdx],
      topics: [
        ...newChapters[chapterIdx].topics,
        { title: "", video: "", quiz: [] },
      ],
    };

    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const handleAddQuestion = (chapterIdx, topicIdx) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIdx].topics[topicIdx] = {
      ...newChapters[chapterIdx].topics[topicIdx],
      quiz: [
        ...newChapters[chapterIdx].topics[topicIdx].quiz,
        {
          question: "",
          options: ["", "", "", ""],
          correctOption: "",
          explaination: "",
        },
      ],
    };

    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const handleChapterChange = (chapterIdx, value) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIdx].title = value;
    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const handleTopicChange = (chapterIdx, topicIdx, field, e) => {
    const newChapters = [...formData.chapters];

    if (field === "title") {
      newChapters[chapterIdx].topics[topicIdx][field] = e.target.value;
    } else if (field === "video") {
      newChapters[chapterIdx].topics[topicIdx][field] = e.target.files[0];
    }

    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };
  console.log(".....", formData);

  const handleQuizOptionChange = (
    e,
    chapterIdx,
    topicIdx,
    quizIdx,
    quizOptionIdx
  ) => {
    const newChapters = [...formData.chapters];
    const oldValue =
      newChapters[chapterIdx].topics[topicIdx].quiz[quizIdx].options[
        quizOptionIdx
      ];
    const newValue = e.target.value;

    // Update the option value
    newChapters[chapterIdx].topics[topicIdx].quiz[quizIdx].options[
      quizOptionIdx
    ] = newValue;

    // If this option was the correct answer, update correctOption to new value
    if (
      newChapters[chapterIdx].topics[topicIdx].quiz[quizIdx].correctOption ===
      oldValue
    ) {
      newChapters[chapterIdx].topics[topicIdx].quiz[quizIdx].correctOption =
        newValue;
    }

    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const handleQuizCorrectOption = (
    chapterIdx,
    topicIdx,
    quizIdx,
    optionIndex
  ) => {
    const newChapters = [...formData.chapters];
    // Store the option value at the given index as correctOption
    newChapters[chapterIdx].topics[topicIdx].quiz[quizIdx].correctOption =
      newChapters[chapterIdx].topics[topicIdx].quiz[quizIdx].options[
        optionIndex
      ];

    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.trim().length > 150) {
      newErrors.title = "Title must be less than 150 characters";
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = "Description must be less than 2000 characters";
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    } else if (formData.category.trim().length < 2) {
      newErrors.category = "Category must be at least 2 characters";
    } else if (formData.category.trim().length > 50) {
      newErrors.category = "Category must be less than 50 characters";
    }

    // Duration validation
    if (!formData.duration) {
      newErrors.duration = "Duration is required";
    } else if (Number(formData.duration) <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    } else if (Number(formData.duration) > 1000) {
      newErrors.duration = "Duration must be less than 1000 hours";
    }

    // Price validation
    if (
      formData.price === "" ||
      formData.price === null ||
      formData.price === undefined
    ) {
      newErrors.price = "Price is required";
    } else if (Number(formData.price) < 0) {
      newErrors.price = "Price cannot be negative";
    } else if (Number(formData.price) > 999999) {
      newErrors.price = "Price must be less than ₹999999";
    }

    // Chapter validations
    formData.chapters.forEach((chapter, chIdx) => {
      if (!chapter.title.trim()) {
        newErrors[`chapter_${chIdx}_title`] = `Chapter ${
          chIdx + 1
        } title is required`;
      } else if (chapter.title.trim().length > 150) {
        newErrors[`chapter_${chIdx}_title`] = `Chapter ${
          chIdx + 1
        } title is too long`;
      }

      chapter.topics.forEach((topic, tpIdx) => {
        if (!topic.title.trim()) {
          newErrors[`topic_${chIdx}_${tpIdx}_title`] = `Topic ${
            tpIdx + 1
          } in Chapter ${chIdx + 1} needs a title`;
        }

        // Quiz validation
        topic.quiz.forEach((q, qIdx) => {
          if (!q.question.trim()) {
            newErrors[`quiz_${chIdx}_${tpIdx}_${qIdx}_question`] = `Question ${
              qIdx + 1
            } is empty`;
          }

          const filledOptions = q.options.filter((opt) => opt.trim() !== "");
          if (filledOptions.length < 2) {
            newErrors[`quiz_${chIdx}_${tpIdx}_${qIdx}_options`] = `Question ${
              qIdx + 1
            } needs at least 2 options`;
          }

          if (!q.correctOption || !q.options.includes(q.correctOption)) {
            newErrors[
              `quiz_${chIdx}_${tpIdx}_${qIdx}_correct`
            ] = `Select correct answer for Question ${qIdx + 1}`;
          }
        });
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector(".input-error");
      if (firstError)
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("level", formData.level);
    data.append("duration", formData.duration);
    data.append("price", formData.price);
    data.append("image", formData.image);
    data.append("video", formData.video);
    if (formData.notes) data.append("notes", formData.notes);
    data.append("teacher", formData.teacher);

    const chaptersCopy = formData.chapters.map((chapter, chapterIdx) => {
      return {
        title: chapter.title,
        topics: chapter.topics.map((topic, topicIdx) => {
          if (topic.video) {
            data.append(
              `chapters[${chapterIdx}][topics][${topicIdx}][video]`,
              topic.video
            );
          }

          return {
            title: topic.title,
            quiz: topic.quiz,
          };
        }),
      };
    });

    data.append("chapters", JSON.stringify(chaptersCopy));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/teacher/courses/create_course`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        }
      );
      const coursesResponse = await response.json();

      if (response.ok) {
        // Assume API returns created course object under data
        const newCourseId = coursesResponse?.data?._id;
        if (createFlashcards && newCourseId) {
          // Redirect directly to flashcards management with preselected course
          navigate(`/teacher/flashcards?courseId=${newCourseId}`);
        } else {
          navigate("/teacher/courses");
        }
      }
    } catch (err) {
      console.log("error occured", err);
    } finally {
      setLoading(false);
    }
  };

  // Styles with original #2337ad color
  const styles = {
    container: {
      width: "55vw",
      margin: "20px auto",
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 0 15px rgba(0,0,0,0.15)",
      paddingBottom: "30px",
    },
    header: {
      textAlign: "center",
      color: "white",
      background: "#2337ad",
      padding: "18px 0",
      margin: "0 40px",
      borderRadius: "12px",
      fontSize: "22px",
      fontWeight: "600",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      padding: "20px 40px",
    },
    label: {
      marginBottom: "8px",
      fontWeight: "500",
      color: "#333",
      fontSize: "14px",
    },
    input: {
      height: "38px",
      marginBottom: "16px",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.2s",
    },
    textarea: {
      minHeight: "80px",
      marginBottom: "16px",
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "14px",
      resize: "vertical",
      outline: "none",
    },
    select: {
      height: "42px",
      marginBottom: "16px",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "14px",
      background: "white",
      cursor: "pointer",
    },
    fileInput: {
      marginBottom: "16px",
      padding: "10px 0",
    },
    addChapterBtn: {
      height: "42px",
      marginBottom: "16px",
      padding: "10px 20px",
      borderRadius: "8px",
      background: "#2337ad",
      color: "white",
      border: "none",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
    chapterBox: {
      background: "#f8f9fa",
      padding: "20px",
      borderRadius: "10px",
      marginBottom: "20px",
      border: "1px solid #e0e0e0",
    },
    chapterHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
    },
    chapterTitle: {
      fontWeight: "600",
      color: "#2337ad",
      fontSize: "16px",
    },
    deleteBtn: {
      padding: "6px 12px",
      background: "#ffebee",
      color: "#d32f2f",
      border: "none",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "500",
      cursor: "pointer",
    },
    topicBox: {
      background: "white",
      padding: "15px",
      borderRadius: "8px",
      marginBottom: "15px",
      marginLeft: "15px",
      border: "1px solid #e8e8e8",
    },
    topicHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
    },
    topicTitle: {
      fontWeight: "500",
      color: "#1976d2",
      fontSize: "14px",
    },
    quizBox: {
      background: "#fff8e1",
      padding: "15px",
      borderRadius: "8px",
      marginTop: "12px",
      border: "1px solid #ffe082",
    },
    quizHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    },
    addBtn: {
      padding: "8px 14px",
      background: "#e3f2fd",
      color: "#2337ad",
      border: "none",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
    },
    optionRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "8px",
    },
    optionInput: {
      flex: 1,
      padding: "8px 10px",
      borderRadius: "6px",
      border: "1px solid #ddd",
      fontSize: "13px",
    },
    checkboxContainer: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginTop: "15px",
      marginBottom: "10px",
    },
    submitBtn: {
      height: "45px",
      marginTop: "15px",
      padding: "12px 20px",
      background: "#2337ad",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Add New Course</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Basic Info */}
        <label style={styles.label}>Title</label>
        <input
          type="text"
          name="title"
          placeholder="Course Title"
          value={formData.title}
          onChange={handleChange}
          required
          maxLength={150}
          style={{
            ...styles.input,
            borderColor: errors.title ? "#dc3545" : "#ddd",
          }}
          className={errors.title ? "input-error" : ""}
        />
        {errors.title && (
          <span
            style={{
              color: "#dc3545",
              fontSize: "12px",
              marginTop: "-12px",
              marginBottom: "12px",
            }}
          >
            {errors.title}
          </span>
        )}

        <label style={styles.label}>Description</label>
        <textarea
          name="description"
          placeholder="Course Description"
          value={formData.description}
          onChange={handleChange}
          required
          maxLength={2000}
          style={{
            ...styles.textarea,
            borderColor: errors.description ? "#dc3545" : "#ddd",
          }}
          className={errors.description ? "input-error" : ""}
        />
        {errors.description && (
          <span
            style={{
              color: "#dc3545",
              fontSize: "12px",
              marginTop: "-12px",
              marginBottom: "12px",
            }}
          >
            {errors.description}
          </span>
        )}

        <label style={styles.label}>Category</label>
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          required
          maxLength={50}
          style={{
            ...styles.input,
            borderColor: errors.category ? "#dc3545" : "#ddd",
          }}
          className={errors.category ? "input-error" : ""}
        />
        {errors.category && (
          <span
            style={{
              color: "#dc3545",
              fontSize: "12px",
              marginTop: "-12px",
              marginBottom: "12px",
            }}
          >
            {errors.category}
          </span>
        )}

        <label style={styles.label}>Level</label>
        <select
          name="level"
          value={formData.level}
          onChange={handleChange}
          style={styles.select}
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advance">Advance</option>
        </select>

        <label style={styles.label}>Duration (in hours)</label>
        <input
          type="number"
          name="duration"
          placeholder="Duration (in hours)"
          value={formData.duration}
          onChange={handleChange}
          required
          min="1"
          max="1000"
          style={{
            ...styles.input,
            borderColor: errors.duration ? "#dc3545" : "#ddd",
          }}
          className={errors.duration ? "input-error" : ""}
        />
        {errors.duration && (
          <span
            style={{
              color: "#dc3545",
              fontSize: "12px",
              marginTop: "-12px",
              marginBottom: "12px",
            }}
          >
            {errors.duration}
          </span>
        )}

        <label style={styles.label}>Price (₹)</label>
        <input
          type="number"
          name="price"
          placeholder="Price (₹)"
          value={formData.price}
          onChange={handleChange}
          required
          min="0"
          max="999999"
          style={{
            ...styles.input,
            borderColor: errors.price ? "#dc3545" : "#ddd",
          }}
          className={errors.price ? "input-error" : ""}
        />
        {errors.price && (
          <span
            style={{
              color: "#dc3545",
              fontSize: "12px",
              marginTop: "-12px",
              marginBottom: "12px",
            }}
          >
            {errors.price}
          </span>
        )}

        <label style={styles.label}>Notes (PDF)</label>
        <input
          type="file"
          name="notes"
          accept="application/pdf"
          onChange={handleChange}
          style={styles.fileInput}
        />

        <label style={styles.label}>Preview Image</label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          style={styles.fileInput}
        />

        <label style={styles.label}>Preview Video</label>
        <input
          type="file"
          name="video"
          accept="video/*"
          onChange={handleChange}
          style={styles.fileInput}
        />

        {/* Chapters Section */}
        <button
          type="button"
          onClick={handleAddChapter}
          style={styles.addChapterBtn}
        >
          + Add Chapter
        </button>

        {formData.chapters.map((chapter, chapterIdx) => (
          <div key={chapterIdx} style={styles.chapterBox}>
            <div style={styles.chapterHeader}>
              <span style={styles.chapterTitle}>Chapter {chapterIdx + 1}</span>
              <button
                type="button"
                onClick={() => handleDeleteChapter(chapterIdx)}
                style={styles.deleteBtn}
              >
                Delete
              </button>
            </div>

            <input
              type="text"
              placeholder="Chapter title"
              value={chapter.title}
              onChange={(e) => handleChapterChange(chapterIdx, e.target.value)}
              style={{ ...styles.input, marginBottom: "12px" }}
            />

            {chapter.topics.map((topic, topicIdx) => (
              <div key={topicIdx} style={styles.topicBox}>
                <div style={styles.topicHeader}>
                  <span style={styles.topicTitle}>Topic {topicIdx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTopic(chapterIdx, topicIdx)}
                    style={{
                      ...styles.deleteBtn,
                      fontSize: "11px",
                      padding: "4px 8px",
                    }}
                  >
                    Delete
                  </button>
                </div>

                <label style={{ ...styles.label, fontSize: "13px" }}>
                  Topic Title
                </label>
                <input
                  type="text"
                  placeholder="Enter topic title"
                  value={topic.title}
                  onChange={(e) =>
                    handleTopicChange(chapterIdx, topicIdx, "title", e)
                  }
                  style={{ ...styles.input, marginBottom: "10px" }}
                />

                <label style={{ ...styles.label, fontSize: "13px" }}>
                  Topic Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    handleTopicChange(chapterIdx, topicIdx, "video", e)
                  }
                  style={styles.fileInput}
                />

                {/* Quiz Section */}
                <div style={styles.quizBox}>
                  <div style={styles.quizHeader}>
                    <span
                      style={{
                        fontWeight: "500",
                        color: "#f57c00",
                        fontSize: "14px",
                      }}
                    >
                      Quiz
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion(chapterIdx, topicIdx)}
                      style={styles.addBtn}
                    >
                      + Add Question
                    </button>
                  </div>

                  {topic.quiz.map((q, quizIdx) => (
                    <div
                      key={quizIdx}
                      style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px dashed #ffe082",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontWeight: "500", fontSize: "13px" }}>
                          Question {quizIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteQuestion(chapterIdx, topicIdx, quizIdx)
                          }
                          style={{
                            ...styles.deleteBtn,
                            fontSize: "10px",
                            padding: "3px 6px",
                          }}
                        >
                          Delete
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Enter question"
                        value={q.question}
                        onChange={(e) => {
                          const newChapters = [...formData.chapters];
                          newChapters[chapterIdx].topics[topicIdx].quiz[
                            quizIdx
                          ].question = e.target.value;
                          setFormData({ ...formData, chapters: newChapters });
                        }}
                        style={{ ...styles.input, marginBottom: "10px" }}
                      />

                      {q.options.map((option, optIdx) => (
                        <div key={optIdx} style={styles.optionRow}>
                          <input
                            type="radio"
                            name={`correct-${chapterIdx}-${topicIdx}-${quizIdx}`}
                            checked={q.correctOption === option}
                            onChange={() =>
                              handleQuizCorrectOption(
                                chapterIdx,
                                topicIdx,
                                quizIdx,
                                optIdx
                              )
                            }
                            style={{ cursor: "pointer" }}
                          />
                          <input
                            type="text"
                            placeholder={`Enter option ${optIdx + 1}`}
                            value={option}
                            onChange={(e) =>
                              handleQuizOptionChange(
                                e,
                                chapterIdx,
                                topicIdx,
                                quizIdx,
                                optIdx
                              )
                            }
                            style={styles.optionInput}
                          />
                        </div>
                      ))}

                      <label
                        style={{
                          ...styles.label,
                          fontSize: "12px",
                          marginTop: "8px",
                        }}
                      >
                        Explanation
                      </label>
                      <input
                        type="text"
                        placeholder="Enter explanation"
                        value={q.explaination}
                        onChange={(e) => {
                          const newChapters = [...formData.chapters];
                          newChapters[chapterIdx].topics[topicIdx].quiz[
                            quizIdx
                          ].explaination = e.target.value;
                          setFormData({ ...formData, chapters: newChapters });
                        }}
                        style={styles.input}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => handleAddTopic(chapterIdx)}
              style={{ ...styles.addBtn, marginTop: "10px" }}
            >
              + Add Topic
            </button>
          </div>
        ))}

        {/* Flashcard Checkbox */}
        <div style={styles.checkboxContainer}>
          <input
            type="checkbox"
            id="createFlashcards"
            checked={createFlashcards}
            onChange={(e) => setCreateFlashcards(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <label htmlFor="createFlashcards" style={{ fontSize: "14px" }}>
            After creating the course, go to Flashcards to create a deck
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.submitBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating..." : "Add Course"}
        </button>
      </form>
    </div>
  );
};

export default AddCourse;
