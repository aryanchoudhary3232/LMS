import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddCard from './AddCard';
import CardEditor from './CardEditor';
import './EditDeck.css';

const EditDeck = ({ deck, onClose, onUpdate }) => {
  const [cards, setCards] = useState(deck.cards || []);
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState(null);
  const [deckPublished, setDeckPublished] = useState(deck.isPublished);
  const [deckInfo, setDeckInfo] = useState(deck); // FIX: hold fetched details

  const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/flashcards`; // FIX
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function loadDetails() {
      try {
        const resp = await axios.get(`${API_URL}/${deck._id}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fullDeck = resp.data.data;
        setDeckInfo(fullDeck);
        setCards(fullDeck.cards || []);
        setDeckPublished(!!fullDeck.isPublished);
      } catch (err) {
        console.error('Failed to load deck details', err);
      }
    }
    loadDetails();
  }, [API_URL, deck._id, token]);

  const handleAddCard = async (cardData) => {
    try {
      const resp = await axios.post(`${API_URL}/${deck._id}/cards`, { cards: [cardData] }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Use server state so new cards have _id
      setCards(resp.data.data.cards || []);
      setShowAddCard(false);
      alert('Card added successfully!');
    } catch (err) {
      alert('Failed to add card');
      console.error(err);
    }
  };

  const handleEditCard = async (updatedCard) => {
    try {
      const cardId = cards[editingCardIndex]._id;
      await axios.put(`${API_URL}/${deck._id}/cards/${cardId}`, updatedCard, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newCards = [...cards];
      // Preserve original _id if not included in updatedCard
      newCards[editingCardIndex] = { ...newCards[editingCardIndex], ...updatedCard };
      setCards(newCards);
      setEditingCardIndex(null);
      alert('Card updated successfully!');
    } catch (err) {
      alert('Failed to update card');
      console.error(err);
    }
  };

  const handleDeleteCard = async (index) => {
    if (!window.confirm('Delete this card?')) return;

    try {
      const cardId = cards[index]._id;
      await axios.delete(`${API_URL}/${deck._id}/cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCards(cards.filter((_, i) => i !== index));
      alert('Card deleted!');
    } catch (err) {
      alert('Failed to delete card');
      console.error(err);
    }
  };

  const handlePublish = async () => {
    if (cards.length === 0) {
      alert('Add at least one card before publishing');
      return;
    }

    try {
      await axios.put(`${API_URL}/${deck._id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeckPublished(true);
      alert('Deck published successfully!');
      onUpdate();
    } catch (err) {
      alert('Failed to publish deck');
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay full-screen">
      <div className="edit-deck-container">
        <div className="edit-header">
          <h2>📝 {deck.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="deck-info">
          <p><strong>Course:</strong> {deckInfo.courseId?.title}</p> {/* FIX: title */}
          <p><strong>Status:</strong> {deckPublished ? '✓ Published' : '○ Draft'}</p>
          <p><strong>Cards:</strong> {cards.length}</p>
        </div>

        {deckPublished && (
          <div className="warning-box">
            ⚠️ This deck is published. You cannot edit or delete cards. Create a new version to make changes.
          </div>
        )}

        <div className="cards-section">
          <div className="section-header">
            <h3>🎴 Flashcards ({cards.length})</h3>
            {!deckPublished && (
              <button
                className="btn-add-card"
                onClick={() => setShowAddCard(true)}
              >
                + Add Card
              </button>
            )}
          </div>

          {showAddCard && (
            <AddCard
              onAdd={handleAddCard}
              onCancel={() => setShowAddCard(false)}
            />
          )}

          <div className="cards-list">
            {cards.length === 0 ? (
              <p className="no-cards">No cards yet. Add your first card!</p>
            ) : (
              cards.map((card, index) => (
                <div key={index} className="card-item">
                  <div className="card-content">
                    <div className="card-type-badge">{card.type?.toUpperCase()}</div>
                    <div className="card-text">
                      <p><strong>Q:</strong> {card.question}</p>
                      <p><strong>A:</strong> {card.answer}</p>
                      {card.lectureTimestamp && (
                        <small className="timestamp">⏱️ {card.lectureTimestamp}</small>
                      )}
                    </div>
                  </div>
                  <div className="card-actions">
                    {!deckPublished && (
                      <>
                        <button
                          className="btn-small btn-edit"
                          onClick={() => setEditingCardIndex(index)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-small btn-delete"
                          onClick={() => handleDeleteCard(index)}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )))
            }
          </div>
        </div>

        {editingCardIndex !== null && (
          <CardEditor
            card={cards[editingCardIndex]}
            onSave={handleEditCard}
            onCancel={() => setEditingCardIndex(null)}
          />
        )}

        <div className="edit-footer">
          <button className="btn-cancel" onClick={onClose}>Close</button>
          {!deckPublished && (
            <button className="btn-publish" onClick={handlePublish}>
              🚀 Publish Deck
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditDeck;