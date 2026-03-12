import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/student/StudentFlashcards.css';

const StudentFlashcards = () => {
    const { courseId } = useParams();
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDecks = async () => {
            try {
                const token = localStorage.getItem('token');
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
                const response = await axios.get(`${backendUrl}/api/flashcards/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setDecks(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching decks", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDecks();
    }, [courseId]);

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="student-flashcards-container">
            <h2>Course Flashcards</h2>
            {decks.length === 0 ? (
                <p>No flashcards available for this course.</p>
            ) : (
                <div className="decks-grid">
                    {decks.map(deck => (
                        <div key={deck._id} className="deck-card" onClick={() => navigate(`/student/sidebar/deck/${deck._id}`)}>
                            <h3>{deck.title}</h3>
                            <p>{deck.description}</p>
                            <button className="study-btn">Study Now</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentFlashcards;
