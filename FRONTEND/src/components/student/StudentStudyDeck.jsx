import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/student/StudentFlashcards.css';

const StudentStudyDeck = () => {
    const { deckId } = useParams();
    const [deck, setDeck] = useState(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDeck = async () => {
            try {
                const token = localStorage.getItem('token');
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
                const response = await axios.get(`${backendUrl}/api/flashcards/student/deck/${deckId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setDeck(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching deck", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDeck();
    }, [deckId]);

    if (loading) return <div className="loading">Loading...</div>;
    if (!deck) return <div>Deck not found</div>;
    if (!deck.cards || deck.cards.length === 0) return <div>No cards in this deck.</div>;

    const currentCard = deck.cards[currentCardIndex];

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentCardIndex((prev) => (prev + 1) % deck.cards.length);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentCardIndex((prev) => (prev - 1 + deck.cards.length) % deck.cards.length);
    };

    return (
        <div className="study-deck-container">
            <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
            <h2>{deck.title}</h2>
            <div className="flashcard-area">
                <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                    <div className="card-face front">
                        <p>{currentCard.question}</p>
                        <span className="hint-text">Click to flip</span>
                    </div>
                    <div className="card-face back">
                        <p>{currentCard.answer}</p>
                    </div>
                </div>
            </div>
            <div className="controls">
                <button onClick={handlePrev} disabled={deck.cards.length <= 1}>Previous</button>
                <span>{currentCardIndex + 1} / {deck.cards.length}</span>
                <button onClick={handleNext} disabled={deck.cards.length <= 1}>Next</button>
            </div>
        </div>
    );
};

export default StudentStudyDeck;
