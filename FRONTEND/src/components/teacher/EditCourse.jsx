import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../css/teacher/AddCourse.css";

const EditCourse = () => {
  const token = localStorage.getItem("token");
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

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
    chapters: [],
  });

  // Track existing file URLs
  const [existingFiles, setExistingFiles] = useState({
    image: null,
    video: null,
    notes: null,
  });

  // Fetch course data on mount
  useEffect(() => {
    async function fetchCourse() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/student/courses/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        if (data.success) {
          const course = data.data;
          setFormData({
            title: course.title || "",
            description: course.description || "",
            category: course.category || "",
            level: course.level || "Beginner",
            duration: course.duration || "",
            price: course.price || "",
            image: null,
            video: null,
            notes: null,
            chapters: course.chapters || [],
          });
          setExistingFiles({
            image: course.image,
            video: course.video,
            notes: course.notes,
          });
        } else {
          setError("Failed to load course");
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId, token]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // File size validation
    if (files && files[0]) {
      const file = files[0];
      const maxSize = name === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setFormErrors(prev => ({
          ...prev,
          [name]: name === 'video' 
            ? 'Video file must be less than 100MB' 
            : 'File must be less than 10MB'
        }));
        e.target.value = '';
        return;
      }
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

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
      newChapters[chapterIdx].topics[topicIdx].newVideo = e.target.files[0];
    }
    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const handleQuizOptionChange = (
    e,
    chapterIdx,
    topicIdx,
    quizIdx,
    quizOptionIdx
  ) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIdx].topics[topicIdx].quiz[quizIdx].options[
      quizOptionIdx
    ] = e.target.value;
    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const handleQuizCorrectOption = (e, chapterIdx, topicIdx, quizIdx, val) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIdx].topics[topicIdx].quiz[quizIdx].correctOption = val;
    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const handleDeleteChapter = (chapterIdx) => {
    const newChapters = formData.chapters.filter(
      (_, idx) => idx !== chapterIdx
    );
    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const handleDeleteTopic = (chapterIdx, topicIdx) => {
    const newChapters = [...formData.chapters];
    newChapters[chapterIdx].topics = newChapters[chapterIdx].topics.filter(
      (_, idx) => idx !== topicIdx
    );
    setFormData({
      ...formData,
      chapters: newChapters,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 150) {
      newErrors.title = 'Title must be less than 150 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    } else if (formData.category.trim().length > 50) {
      newErrors.category = 'Category must be less than 50 characters';
    }
    
    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    } else if (Number(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    } else if (Number(formData.duration) > 1000) {
      newErrors.duration = 'Duration must be less than 1000 hours';
    }
    
    if (formData.price === '' || formData.price === null) {
      newErrors.price = 'Price is required';
    } else if (Number(formData.price) < 0) {
      newErrors.price = 'Price cannot be negative';
    } else if (Number(formData.price) > 999999) {
      newErrors.price = 'Price must be less than ₹999999';
    }
    
    formData.chapters.forEach((chapter, chIdx) => {
      if (!chapter.title.trim()) {
        newErrors[`chapter_${chIdx}`] = `Chapter ${chIdx + 1} title is required`;
      }
      chapter.topics.forEach((topic, tpIdx) => {
        if (!topic.title.trim()) {
          newErrors[`topic_${chIdx}_${tpIdx}`] = `Topic ${tpIdx + 1} title is required`;
        }
        topic.quiz?.forEach((q, qIdx) => {
          if (q.question.trim() && q.options.filter(o => o.trim()).length < 2) {
            newErrors[`quiz_${chIdx}_${tpIdx}_${qIdx}`] = `Question needs at least 2 options`;
          }
        });
      });
    });
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    setSaving(true);
    setError(null);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("level", formData.level);
    data.append("duration", formData.duration);
    data.append("price", formData.price);

    // Only append files if new ones were selected
    if (formData.image) data.append("image", formData.image);
    if (formData.video) data.append("video", formData.video);
    if (formData.notes) data.append("notes", formData.notes);

    // Process chapters
    const chaptersCopy = formData.chapters.map((chapter, chapterIdx) => {
      return {
        _id: chapter._id,
        title: chapter.title,
        topics: chapter.topics.map((topic, topicIdx) => {
          // If there's a new video file, append it
          if (topic.newVideo) {
            data.append(
              `chapters[${chapterIdx}][topics][${topicIdx}][video]`,
              topic.newVideo
            );
          }
          return {
            _id: topic._id,
            title: topic.title,
            video: topic.video, // Keep existing video URL
            quiz: topic.quiz,
          };
        }),
      };
    });

    data.append("chapters", JSON.stringify(chaptersCopy));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/teacher/courses/${courseId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        }
      );
      const result = await response.json();

      if (result.success) {
        navigate(`/teacher/courses/${courseId}`);
      } else {
        setError(result.message || "Failed to update course");
      }
    } catch (err) {
      console.error("Error updating course:", err);
      setError("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Loading course data...</p>
      </div>
    );
  }

  return (
    <div
      className="form-container"
      style={{
        width: "50vw",
        marginLeft: "auto",
        marginRight: "auto",
        marginTop: "2px",
        boxShadow: "0 0 12px rgba(0,0,0,0.2)",
        borderRadius: "12px",
        marginBottom: "30px",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "white",
          background: "#2337ad",
          height: "3rem",
          paddingTop: "16px",
          marginTop: "0",
          borderRadius: "12px",
          marginLeft: "47px",
          marginRight: "50px",
        }}
      >
        Edit Course
      </h2>

      {error && (
        <div
          style={{
            color: "red",
            textAlign: "center",
            padding: "10px",
            margin: "0 42px",
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: "12px",
          paddingRight: "12px",
        }}
      >
        <label style={{ marginLeft: "42px", marginBottom: "9px" }}>Title</label>
        <input
          type="text"
          name="title"
          placeholder="Course Title"
          value={formData.title}
          onChange={handleChange}
          required
          maxLength={150}
          style={{
            height: "26px",
            margin: "0 42px 6px 42px",
            padding: "5px",
            borderRadius: "5px",
            borderColor: formErrors.title ? '#dc3545' : '#ccc'
          }}
        />
        {formErrors.title && <span style={{ color: '#dc3545', fontSize: '12px', marginLeft: '42px', marginBottom: '12px', display: 'block' }}>{formErrors.title}</span>}

        <label style={{ marginLeft: "42px", marginBottom: "9px" }}>
          Description
        </label>
        <textarea
          name="description"
          placeholder="Course Description"
          value={formData.description}
          onChange={handleChange}
          required
          maxLength={2000}
          style={{
            height: "80px",
            margin: "0 42px 6px 42px",
            padding: "5px",
            borderRadius: "5px",
            borderColor: formErrors.description ? '#dc3545' : '#ccc'
          }}
        />
        {formErrors.description && <span style={{ color: '#dc3545', fontSize: '12px', marginLeft: '42px', marginBottom: '12px', display: 'block' }}>{formErrors.description}</span>}

        <label style={{ marginLeft: "42px", marginBottom: "9px" }}>
          Category
        </label>
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          required
          maxLength={50}
          style={{
            height: "26px",
            margin: "0 42px 6px 42px",
            padding: "5px",
            borderRadius: "5px",
            borderColor: formErrors.category ? '#dc3545' : '#ccc'
          }}
        />
        {formErrors.category && <span style={{ color: '#dc3545', fontSize: '12px', marginLeft: '42px', marginBottom: '12px', display: 'block' }}>{formErrors.category}</span>}

        <label style={{ marginLeft: "42px", marginBottom: "9px" }}>Level</label>
        <select
          name="level"
          value={formData.level}
          onChange={handleChange}
          style={{
            height: "41px",
            margin: "0 42px 12px 42px",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advance">Advance</option>
        </select>

        <label style={{ marginLeft: "42px", marginBottom: "9px" }}>
          Duration (hours)
        </label>
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
            height: "26px",
            margin: "0 42px 6px 42px",
            padding: "5px",
            borderRadius: "5px",
            borderColor: formErrors.duration ? '#dc3545' : '#ccc'
          }}
        />
        {formErrors.duration && <span style={{ color: '#dc3545', fontSize: '12px', marginLeft: '42px', marginBottom: '12px', display: 'block' }}>{formErrors.duration}</span>}

        <label style={{ marginLeft: "42px", marginBottom: "9px" }}>
          Price (₹)
        </label>
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
            height: "26px",
            margin: "0 42px 6px 42px",
            padding: "5px",
            borderRadius: "5px",
            borderColor: formErrors.price ? '#dc3545' : '#ccc'
          }}
        />
        {formErrors.price && <span style={{ color: '#dc3545', fontSize: '12px', marginLeft: '42px', marginBottom: '12px', display: 'block' }}>{formErrors.price}</span>}

        {/* File uploads with existing file indicators */}
        <label style={{ marginLeft: "42px", marginBottom: "9px" }}>
          Notes (PDF)
          {existingFiles.notes && (
            <span
              style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}
            >
              (Current file exists - upload new to replace)
            </span>
          )}
        </label>
        <input
          type="file"
          name="notes"
          accept="application/pdf"
          onChange={handleChange}
          style={{ margin: "0 42px 12px 42px" }}
        />

        <label style={{ marginLeft: "42px", marginBottom: "9px" }}>
          Preview Image
          {existingFiles.image && (
            <span
              style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}
            >
              (Current image exists - upload new to replace)
            </span>
          )}
        </label>
        {existingFiles.image && (
          <img
            src={existingFiles.image}
            alt="Current preview"
            style={{
              width: "100px",
              height: "60px",
              objectFit: "cover",
              margin: "0 42px 8px 42px",
              borderRadius: "5px",
            }}
          />
        )}
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          style={{ margin: "0 42px 12px 42px" }}
        />

        <label style={{ marginLeft: "42px", marginBottom: "9px" }}>
          Preview Video
          {existingFiles.video && (
            <span
              style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}
            >
              (Current video exists - upload new to replace)
            </span>
          )}
        </label>
        <input
          type="file"
          name="video"
          accept="video/*"
          onChange={handleChange}
          style={{ margin: "0 42px 12px 42px" }}
        />

        {/* Chapters Section */}
        <div
          style={{
            margin: "20px 42px",
            padding: "15px",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Chapters & Topics</h3>

          <button
            type="button"
            onClick={handleAddChapter}
            style={{
              padding: "10px 20px",
              borderRadius: "5px",
              background: "#2337ad",
              color: "white",
              border: "none",
              cursor: "pointer",
              marginBottom: "15px",
            }}
          >
            + Add Chapter
          </button>

          {formData.chapters.map((chapter, chapterIdx) => (
            <div
              key={chapterIdx}
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "15px",
                border: "1px solid #ddd",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <label style={{ fontWeight: "bold" }}>
                  Chapter {chapterIdx + 1}
                </label>
                <button
                  type="button"
                  onClick={() => handleDeleteChapter(chapterIdx)}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>

              <input
                type="text"
                placeholder="Chapter Title"
                value={chapter.title}
                onChange={(e) =>
                  handleChapterChange(chapterIdx, e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  marginBottom: "10px",
                }}
              />

              {/* Topics */}
              {chapter.topics.map((topic, topicIdx) => (
                <div
                  key={topicIdx}
                  style={{
                    background: "#f9f9f9",
                    padding: "10px",
                    borderRadius: "5px",
                    marginBottom: "10px",
                    marginLeft: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <label>Topic {topicIdx + 1}</label>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(chapterIdx, topicIdx)}
                      style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Topic Title"
                    value={topic.title}
                    onChange={(e) =>
                      handleTopicChange(chapterIdx, topicIdx, "title", e)
                    }
                    style={{
                      width: "100%",
                      padding: "6px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      marginBottom: "8px",
                    }}
                  />

                  <label style={{ fontSize: "12px", color: "#666" }}>
                    Topic Video
                    {topic.video && (
                      <span style={{ marginLeft: "10px" }}>
                        (Current video exists)
                      </span>
                    )}
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) =>
                      handleTopicChange(chapterIdx, topicIdx, "video", e)
                    }
                    style={{ marginBottom: "8px", display: "block" }}
                  />

                  {/* Quiz section */}
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                      Quiz Questions
                    </label>
                    {topic.quiz &&
                      topic.quiz.map((q, quizIdx) => (
                        <div
                          key={quizIdx}
                          style={{
                            background: "white",
                            padding: "10px",
                            borderRadius: "4px",
                            marginTop: "8px",
                            border: "1px solid #eee",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Question"
                            value={q.question}
                            onChange={(e) => {
                              const newChapters = [...formData.chapters];
                              newChapters[chapterIdx].topics[topicIdx].quiz[
                                quizIdx
                              ].question = e.target.value;
                              setFormData({
                                ...formData,
                                chapters: newChapters,
                              });
                            }}
                            style={{
                              width: "100%",
                              padding: "6px",
                              borderRadius: "4px",
                              border: "1px solid #ccc",
                              marginBottom: "8px",
                            }}
                          />
                          {q.options.map((option, optIdx) => (
                            <div
                              key={optIdx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "4px",
                              }}
                            >
                              <input
                                type="radio"
                                name={`correct-${chapterIdx}-${topicIdx}-${quizIdx}`}
                                checked={q.correctOption === option}
                                onChange={() =>
                                  handleQuizCorrectOption(
                                    null,
                                    chapterIdx,
                                    topicIdx,
                                    quizIdx,
                                    option
                                  )
                                }
                              />
                              <input
                                type="text"
                                placeholder={`Option ${optIdx + 1}`}
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
                                style={{
                                  flex: 1,
                                  marginLeft: "8px",
                                  padding: "4px",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                }}
                              />
                            </div>
                          ))}
                          <input
                            type="text"
                            placeholder="Explanation"
                            value={q.explaination || ""}
                            onChange={(e) => {
                              const newChapters = [...formData.chapters];
                              newChapters[chapterIdx].topics[topicIdx].quiz[
                                quizIdx
                              ].explaination = e.target.value;
                              setFormData({
                                ...formData,
                                chapters: newChapters,
                              });
                            }}
                            style={{
                              width: "100%",
                              padding: "6px",
                              borderRadius: "4px",
                              border: "1px solid #ccc",
                              marginTop: "8px",
                            }}
                          />
                        </div>
                      ))}
                    <button
                      type="button"
                      onClick={() => handleAddQuestion(chapterIdx, topicIdx)}
                      style={{
                        marginTop: "8px",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      + Add Question
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => handleAddTopic(chapterIdx)}
                style={{
                  marginTop: "10px",
                  padding: "8px 15px",
                  borderRadius: "5px",
                  background: "#17a2b8",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                + Add Topic
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "15px",
            margin: "20px 42px",
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              padding: "12px",
              background: "#6c757d",
              color: "white",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              padding: "12px",
              background: saving ? "#999" : "#2337ad",
              color: "white",
              borderRadius: "5px",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Update Course"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCourse;
