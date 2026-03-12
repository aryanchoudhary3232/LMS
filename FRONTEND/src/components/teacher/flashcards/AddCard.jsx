import React, { useState } from 'react';
import './AddCard.css';

const AddCard = ({ onAdd, onCancel }) => {
  const [cardType, setCardType] = useState('qa');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    type: 'qa',
    question: '',
    answer: '',
    clozeText: '',
    hints: [],
    difficulty: 'medium',
    tags: '',
    lectureTimestamp: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    } else if (formData.question.trim().length < 3) {
      newErrors.question = 'Question must be at least 3 characters';
    } else if (formData.question.length > 1000) {
      newErrors.question = 'Question must be less than 1000 characters';
    }
    
    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required';
    } else if (formData.answer.trim().length < 1) {
      newErrors.answer = 'Answer is required';
    } else if (formData.answer.length > 2000) {
      newErrors.answer = 'Answer must be less than 2000 characters';
    }
    
    // Timestamp format validation (MM:SS or HH:MM:SS)
    if (formData.lectureTimestamp && formData.lectureTimestamp.trim()) {
      const timestampRegex = /^(?:[0-9]{1,2}:)?[0-5]?[0-9]:[0-5][0-9]$/;
      if (!timestampRegex.test(formData.lectureTimestamp.trim())) {
        newErrors.lectureTimestamp = 'Invalid format. Use MM:SS or HH:MM:SS (e.g., 12:34 or 1:23:45)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const card = {
      type: cardType,
      question: formData.question,
      answer: formData.answer,
      clozeText: formData.clozeText,
      hints: formData.hints.length > 0 ? formData.hints.split(',').map(h => h.trim()) : [],
      difficulty: formData.difficulty,
      tags: formData.tags.length > 0 ? formData.tags.split(',').map(t => t.trim()) : [],
      lectureTimestamp: formData.lectureTimestamp
    };

    onAdd(card);
    setFormData({
      type: 'qa',
      question: '',
      answer: '',
      clozeText: '',
      hints: [],
      difficulty: 'medium',
      tags: '',
      lectureTimestamp: ''
    });
  };

  return (
    <div className="add-card-form">
      <h4>Add New Card</h4>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Card Type</label>
            <select value={cardType} onChange={(e) => setCardType(e.target.value)}>
              <option value="qa">Question & Answer</option>
              <option value="cloze">Cloze (Fill the blank)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Question *</label>
          <textarea
            name="question"
            value={formData.question}
            onChange={handleChange}
            placeholder="Enter the question or prompt"
            rows="3"
            required
            maxLength={1000}
            style={{ borderColor: errors.question ? '#dc3545' : undefined }}
          />
          {errors.question && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.question}</span>}
        </div>

        <div className="form-group">
          <label>Answer *</label>
          <textarea
            name="answer"
            value={formData.answer}
            onChange={handleChange}
            placeholder="Enter the answer"
            rows="3"
            required
            maxLength={2000}
            style={{ borderColor: errors.answer ? '#dc3545' : undefined }}
          />
          {errors.answer && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.answer}</span>}
        </div>

        {cardType === 'cloze' && (
          <div className="form-group">
            <label>Cloze Text (Optional)</label>
            <input
              type="text"
              name="clozeText"
              value={formData.clozeText}
              onChange={handleChange}
              placeholder="e.g., The capital of France is ___"
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., biology, chapter3, important"
            />
          </div>

          <div className="form-group">
            <label>Lecture Timestamp</label>
            <input
              type="text"
              name="lectureTimestamp"
              value={formData.lectureTimestamp}
              onChange={handleChange}
              placeholder="e.g., 12:34 or 1:23:45"
              style={{ borderColor: errors.lectureTimestamp ? '#dc3545' : undefined }}
            />
            {errors.lectureTimestamp && <span style={{ color: '#dc3545', fontSize: '12px' }}>{errors.lectureTimestamp}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Hints (comma-separated, optional)</label>
          <input
            type="text"
            name="hints"
            value={formData.hints}
            onChange={handleChange}
            placeholder="e.g., Think about Europe, major city"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-submit">
            Add Card
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCard;