import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../css/teacher/Assignments.css";

const CreateAssignment = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    course: "",
    chapter: "",
    maxMarks: 100,
    dueDate: "",
    allowLateSubmission: false,
    submissionType: "both",
  });
  const [files, setFiles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/teacher/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    
    const oversizedFiles = selectedFiles.filter(f => f.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      setErrors(prev => ({ ...prev, files: 'Each file must be less than 10MB' }));
      e.target.value = '';
      return;
    }
    
    if (selectedFiles.length > 5) {
      setErrors(prev => ({ ...prev, files: 'Maximum 5 files allowed' }));
      e.target.value = '';
      return;
    }
    
    setErrors(prev => ({ ...prev, files: '' }));
    setFiles(selectedFiles);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    // Course validation
    if (!formData.course) {
      newErrors.course = 'Please select a course';
    }
    
    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }
    
    // Instructions validation (optional but has limits)
    if (formData.instructions && formData.instructions.length > 5000) {
      newErrors.instructions = 'Instructions must be less than 5000 characters';
    }
    
    // Max marks validation
    if (!formData.maxMarks || formData.maxMarks < 1) {
      newErrors.maxMarks = 'Max marks must be at least 1';
    } else if (formData.maxMarks > 1000) {
      newErrors.maxMarks = 'Max marks cannot exceed 1000';
    }
    
    // Due date validation
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Append files
      files.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      const response = await fetch(
        `${BACKEND_URL}/assignments/teacher/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Assignment created successfully!");
        navigate("/teacher/assignments");
      } else {
        alert(data.message || "Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-assignment-container">
      <div className="form-header">
        <button
          onClick={() => navigate("/teacher/assignments")}
          className="btn-back"
        >
          ← Back
        </button>
        <h2>📝 Create New Assignment</h2>
      </div>

      <form onSubmit={handleSubmit} className="assignment-form">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="e.g., Week 1 - JavaScript Basics"
              style={{ borderColor: errors.title ? '#dc3545' : undefined }}
            />
            {errors.title && <span className="error-text" style={{ color: '#dc3545', fontSize: '12px' }}>{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Course *</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              required
              style={{ borderColor: errors.course ? '#dc3545' : undefined }}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            {errors.course && <span className="error-text" style={{ color: '#dc3545', fontSize: '12px' }}>{errors.course}</span>}
          </div>

          <div className="form-group">
            <label>Chapter (Optional)</label>
            <input
              type="text"
              name="chapter"
              value={formData.chapter}
              onChange={handleChange}
              placeholder="e.g., Chapter 3: Functions"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="3"
              maxLength={2000}
              placeholder="Brief description of the assignment"
              style={{ borderColor: errors.description ? '#dc3545' : undefined }}
            />
            {errors.description && <span className="error-text" style={{ color: '#dc3545', fontSize: '12px' }}>{errors.description}</span>}
          </div>

          <div className="form-group">
            <label>Detailed Instructions</label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows="5"
              maxLength={5000}
              placeholder="Provide detailed instructions for students..."
              style={{ borderColor: errors.instructions ? '#dc3545' : undefined }}
            />
            {errors.instructions && <span className="error-text" style={{ color: '#dc3545', fontSize: '12px' }}>{errors.instructions}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Assignment Settings</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Maximum Marks *</label>
              <input
                type="number"
                name="maxMarks"
                value={formData.maxMarks}
                onChange={handleChange}
                required
                min="1"
                max="1000"
                style={{ borderColor: errors.maxMarks ? '#dc3545' : undefined }}
              />
              {errors.maxMarks && <span className="error-text" style={{ color: '#dc3545', fontSize: '12px' }}>{errors.maxMarks}</span>}
            </div>

            <div className="form-group">
              <label>Due Date *</label>
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().slice(0, 16)}
                style={{ borderColor: errors.dueDate ? '#dc3545' : undefined }}
              />
              {errors.dueDate && <span className="error-text" style={{ color: '#dc3545', fontSize: '12px' }}>{errors.dueDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Submission Type</label>
            <select
              name="submissionType"
              value={formData.submissionType}
              onChange={handleChange}
            >
              <option value="both">File & Text</option>
              <option value="file">File Only</option>
              <option value="text">Text Only</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={handleChange}
              />
              <span>Allow late submissions</span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Attachments (Optional)</h3>
          <div className="form-group">
            <label>Upload Reference Files (Max 5 files, 10MB each)</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.png"
            />
            {errors.files && <span className="error-text" style={{ color: '#dc3545', fontSize: '12px' }}>{errors.files}</span>}
            {files.length > 0 && (
              <div className="selected-files">
                <p>Selected files:</p>
                <ul>
                  {files.map((file, index) => (
                    <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/teacher/assignments")}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssignment;
