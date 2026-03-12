import React, { useState } from 'react';
import './EditDeck.css';

// CardEditor allows editing an existing flashcard. It preserves the original _id.
// Props:
//  card: existing card object
//  onSave: function(updatedCard)
//  onCancel: function()
const CardEditor = ({ card, onSave, onCancel }) => {
  const [cardType, setCardType] = useState(card.type || 'qa');
  const [formData, setFormData] = useState({
    _id: card._id, // preserve id so parent can keep reference
    type: card.type || 'qa',
    question: card.question || '',
    answer: card.answer || '',
    clozeText: card.clozeText || '',
    hints: card.hints ? card.hints.join(', ') : '',
    difficulty: card.difficulty || 'medium',
    tags: card.tags ? card.tags.join(', ') : '',
    lectureTimestamp: card.lectureTimestamp || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Question and answer are required');
      return;
    }

    const updated = {
      _id: formData._id,
      type: cardType,
      question: formData.question,
      answer: formData.answer,
      clozeText: formData.clozeText,
      hints: formData.hints.length > 0 ? formData.hints.split(',').map(h => h.trim()) : [],
      difficulty: formData.difficulty,
      tags: formData.tags.length > 0 ? formData.tags.split(',').map(t => t.trim()) : [],
      lectureTimestamp: formData.lectureTimestamp
    };

    onSave(updated);
  };

  return (
    <div className="card-editor-modal">
      <div className="card-editor">
        <h4>Edit Card</h4>
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
              rows="3"
              required
            />
          </div>
          <div className="form-group">
            <label>Answer *</label>
            <textarea
              name="answer"
              value={formData.answer}
              onChange={handleChange}
              rows="3"
              required
            />
          </div>

          {cardType === 'cloze' && (
            <div className="form-group">
              <label>Cloze Text</label>
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
                  placeholder="e.g., 12:34"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Hints (comma-separated)</label>
              <input
                type="text"
                name="hints"
                value={formData.hints}
                onChange={handleChange}
                placeholder="e.g., Think about Europe, major city"
              />
            </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardEditor;
