# SeekhoBharat - Domain Driven Design

## a) Bounded Contexts
1. **IAM (Identity & Access Management) Context**: Handles user registrations, authentication, role administration (Admin, Student, Teacher, Superadmin), and the Teacher Validation process.
2. **Course Catalog Context**: Manages the creation and organization of Courses, Modules, Lessons, Quizzes, Flashcards, and Assignments.
3. **Learning Execution Context**: Handles student enrollments, assignment submissions, quiz attempts, and tracks learning progress.
4. **Productivity & Tracking Context**: Manages Study Timer sessions, Daily Study Streaks, and dashboards.
5. **Feedback Context**: Manages anonymous course reviews and ratings.

## b) Context Mappings
The context mapping illustrates the relationship between different bounded contexts in the system. The IAM context is upstream to all other contexts because they rely on user identity and roles. The Course Catalog is upstream to Learning Execution and Feedback.
*(See `context_mapping.png` for diagram)*

## c) Entities, Value Objects, and Services
- **IAM Context**
  - **Entities**: User (Superadmin, Admin, Teacher, Student)
  - **Value Objects**: Credentials, EmailAddress, RoleType, ValidationStatus
  - **Services**: AuthenticationService, TeacherValidationService
- **Course Catalog Context**
  - **Entities**: Course, Module, Lesson, Assessment (Assignment, Quiz), FlashcardDeck
  - **Value Objects**: Category, Tags, Deadline
  - **Services**: CoursePublishingService
- **Learning Execution Context**
  - **Entities**: Enrollment, Submission, QuizAttempt
  - **Value Objects**: Score, ProgressPercentage, SubmissionData
  - **Services**: GradingService, AssignmentValidatorService
- **Productivity & Tracking Context**
  - **Entities**: StreakTracker, StudySession
  - **Value Objects**: Duration, Date
  - **Services**: StreakCalculationService, TimerService
- **Feedback Context**
  - **Entities**: CourseReview
  - **Value Objects**: RatingValue, AnonymousToken
  - **Services**: AnonymizerService

## d) Cardinality Ratios
- `Teacher (User)` **1 : M** `Course` (A teacher can create multiple courses)
- `Student (User)` **M : N** `Course` (A student can enroll in multiple courses, and courses have multiple students)
- `Course` **1 : M** `Module` (A course contains multiple modules)
- `Module` **1 : M** `Lesson / Assessment` (A module contains multiple lessons, quizzes, or assignments)
- `Student (User)` **1 : 1** `StreakTracker` (Each student has one tracking profile)
- `StreakTracker` **1 : M** `StudySession` (A tracking profile records multiple study sessions)
- `Assessment` **1 : M** `Submission` (An assignment receives multiple student submissions)
- `Course` **1 : M** `CourseReview` (A course receives multiple anonymous reviews)

## e) Aggregates
- **User Aggregate** *(IAM Context)*: Root is `User`. Encapsulates identity, role, and auth credentials.
- **Course Aggregate** *(Course Catalog Context)*: Root is `Course`. Encapsulates modules, lessons, and assessments (they have no meaning outside the course context).
- **Enrollment Aggregate** *(Learning Execution Context)*: Root is `Enrollment`. Encapsulates the tracking of a specific student in a specific course.
- **Submission Aggregate** *(Learning Execution Context)*: Root is `Submission`. Evaluated independently.
- **Productivity Aggregate** *(Productivity Context)*: Root is `StreakTracker`. Encapsulates multiple `StudySession` entities.
*(See `aggregates.png` for diagram)*
