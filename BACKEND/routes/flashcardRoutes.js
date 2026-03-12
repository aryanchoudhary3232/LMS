const express = require('express');
const router = express.Router();
const { verify, verifyTeacher } = require('../middleware');
const flashcard = require('../controller/flashcardController');

// teacher-owned deck APIs
router.get('/teacher/decks', verify, verifyTeacher, flashcard.getTeacherDecks);
router.post('/create', verify, verifyTeacher, flashcard.createFlashcardDeck);
router.get('/:deckId/details', verify, verifyTeacher, flashcard.getDeckDetails);
router.delete('/:deckId', verify, verifyTeacher, flashcard.deleteDeck);

router.post('/:deckId/cards', verify, verifyTeacher, flashcard.addCards);
router.put('/:deckId/cards/:cardId', verify, verifyTeacher, flashcard.editCard);
router.delete('/:deckId/cards/:cardId', verify, verifyTeacher, flashcard.deleteCard);

router.post('/:deckId/publish', verify, verifyTeacher, flashcard.publishDeck);
router.put('/:deckId/publish', verify, verifyTeacher, flashcard.publishDeck);

// Student APIs
router.get('/course/:courseId', verify, flashcard.getCourseDecks);
router.get('/student/deck/:deckId', verify, flashcard.getStudyDeck);

module.exports = router;