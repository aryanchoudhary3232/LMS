import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './TeacherFlashcards.css';
import CreateFlashcardDeck from './CreateFlashcardDeck';
import FlashcardDeckList from './FlashcardDeckList';
import EditDeck from './EditDeck';

const TeacherFlashcards = () => {
  const [decks, setDecks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preselectedCourseId, setPreselectedCourseId] = useState(null);
  const [searchParams] = useSearchParams();

  const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/flashcards`; // FIX: env
  const token = localStorage.getItem('token');

  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      if (!token) {
        setError('Not authenticated');
        return;
      }
      const response = await axios.get(`${API_URL}/teacher/decks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDecks(response.data.data);
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load flashcard decks';
      setError(msg);
      console.error('fetchDecks error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchDecks();
    const qsCourseId = searchParams.get('courseId');
    if (qsCourseId) {
      setPreselectedCourseId(qsCourseId);
      setShowCreateModal(true);
    }
  }, [searchParams, fetchDecks]);

  const handleCreateDeck = async (deckData) => {
    try {
      await axios.post(`${API_URL}/create`, deckData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDecks(); // FIX: ensure populated list
      setShowCreateModal(false);
      alert('Flashcard deck created successfully!');
    } catch (err) {
      alert('Failed to create deck: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) return;

    try {
      await axios.delete(`${API_URL}/${deckId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDecks(decks.filter(d => d._id !== deckId));
      alert('Deck deleted successfully!');
    } catch (err) {
      alert('Failed to delete deck');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading flashcards...</div>;

  return (
    <div className="teacher-flashcards">
      <div className="flashcard-header">
        <h1>📚 My Flashcard Decks</h1>
        <button 
          className="btn-create-deck"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Deck
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateModal && (
        <CreateFlashcardDeck
          initialCourseId={preselectedCourseId}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateDeck}
        />
      )}

      {editingDeck && (
        <EditDeck
          deck={editingDeck}
          onClose={() => setEditingDeck(null)}
          onUpdate={fetchDecks}
        />
      )}

      <FlashcardDeckList
        decks={decks}
        onEdit={setEditingDeck}
        onDelete={handleDeleteDeck}
      />
    </div>
  );
};

export default TeacherFlashcards;