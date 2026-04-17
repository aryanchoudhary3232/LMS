const express = require('express');
const router = express.Router();
const {
	verify,
	verifyTeacher,
	cacheResponse,
	cacheTags,
	invalidateTagsOnSuccess,
} = require('../middleware');
const flashcard = require('../controller/flashcardController');

// teacher-owned deck APIs
router.get(
	'/teacher/decks',
	verify,
	verifyTeacher,
	cacheResponse({
		ttlSeconds: 180,
		namespace: 'flashcard-teacher-decks',
		varyByUser: true,
		tags: (req) => [cacheTags.teacher(req.user?._id)],
	}),
	flashcard.getTeacherDecks,
);

router.post(
	'/create',
	verify,
	verifyTeacher,
	invalidateTagsOnSuccess((req) => [cacheTags.teacher(req.user?._id)]),
	flashcard.createFlashcardDeck,
);

router.get(
	'/:deckId/details',
	verify,
	verifyTeacher,
	cacheResponse({
		ttlSeconds: 120,
		namespace: 'flashcard-deck-details',
		varyByUser: true,
		tags: (req) => [cacheTags.teacher(req.user?._id)],
	}),
	flashcard.getDeckDetails,
);

router.delete(
	'/:deckId',
	verify,
	verifyTeacher,
	invalidateTagsOnSuccess((req) => [cacheTags.teacher(req.user?._id)]),
	flashcard.deleteDeck,
);

router.post(
	'/:deckId/cards',
	verify,
	verifyTeacher,
	invalidateTagsOnSuccess((req) => [cacheTags.teacher(req.user?._id)]),
	flashcard.addCards,
);

router.put(
	'/:deckId/cards/:cardId',
	verify,
	verifyTeacher,
	invalidateTagsOnSuccess((req) => [cacheTags.teacher(req.user?._id)]),
	flashcard.editCard,
);

router.delete(
	'/:deckId/cards/:cardId',
	verify,
	verifyTeacher,
	invalidateTagsOnSuccess((req) => [cacheTags.teacher(req.user?._id)]),
	flashcard.deleteCard,
);

router.post(
	'/:deckId/publish',
	verify,
	verifyTeacher,
	invalidateTagsOnSuccess((req, body) => [
		cacheTags.teacher(req.user?._id),
		cacheTags.course(body?.data?.courseId || req.body?.courseId),
	]),
	flashcard.publishDeck,
);

router.put(
	'/:deckId/publish',
	verify,
	verifyTeacher,
	invalidateTagsOnSuccess((req, body) => [
		cacheTags.teacher(req.user?._id),
		cacheTags.course(body?.data?.courseId || req.body?.courseId),
	]),
	flashcard.publishDeck,
);

// Student APIs
router.get(
	'/course/:courseId',
	verify,
	cacheResponse({
		ttlSeconds: 180,
		namespace: 'flashcard-course-decks',
		varyByUser: true,
		tags: (req) => [cacheTags.course(req.params.courseId)],
	}),
	flashcard.getCourseDecks,
);

router.get(
	'/student/deck/:deckId',
	verify,
	cacheResponse({
		ttlSeconds: 120,
		namespace: 'flashcard-study-deck',
		varyByUser: true,
		tags: (req) => [cacheTags.student(req.user?._id)],
	}),
	flashcard.getStudyDeck,
);

module.exports = router;