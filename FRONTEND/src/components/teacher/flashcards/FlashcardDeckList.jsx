import React from 'react';
import './DeckList.css';

const FlashcardDeckList = ({ decks, onEdit, onDelete }) => {
  if (decks.length === 0) {
    return (
      <div className="empty-state">
        <p>📭 No flashcard decks yet. Create your first deck to get started!</p>
      </div>
    );
  }

  return (
    <div className="deck-list">
      {decks.map(deck => (
        <div key={deck._id} className="deck-card">
          <div className="deck-header">
            <h3>{deck.title}</h3>
            <span className={`status-badge ${deck.isPublished ? 'published' : 'draft'}`}>
              {deck.isPublished ? '✓ Published' : '○ Draft'}
            </span>
          </div>

          {deck.description && (
            <p className="deck-description">{deck.description}</p>
          )}

          <div className="deck-meta">
            <span className="course-name">📖 {deck.courseId?.title}</span> {/* FIX: title */}
            <span className="card-count">🎴 {deck.cards?.length || 0} cards</span>
            <span className="visibility">👁️ {deck.visibility}</span>
          </div>

          <div className="deck-actions">
            <button
              className="btn-edit"
              onClick={() => onEdit(deck)}
              title="Edit this deck"
            >
              ✏️ Edit
            </button>
            <button
              className="btn-delete"
              onClick={() => onDelete(deck._id)}
              title="Delete this deck"
            >
              🗑️ Delete
            </button>
          </div>

          {deck.stats && (
            <div className="deck-stats">
              <small>📊 {deck.stats.totalReviews} reviews · ⭐ {deck.stats.avgRating?.toFixed(1)}</small>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FlashcardDeckList;