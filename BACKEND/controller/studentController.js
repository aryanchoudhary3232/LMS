const Student = require("../models/Student");
const QuizSubmission = require("../models/QuizSubmission");
const Course = require("../models/Course");

async function getStudents(req, res) {
  try {
    const students = await Student.find().select("_id name email");
    res.json({
      message: "Students retrieved successfully",
      data: students,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      message: "Error fetching students",
      success: false,
      error: true,
    });
  }
}

async function studentProfile(req, res) {
  try {
    const studentId = req.user._id;
    const student = await Student.findById(studentId).populate({
      path: "enrolledCourses.course",
      select: "title image price category level",
    });

    // Calculate quiz statistics for each enrolled course
    const enrolledCoursesWithStats = student.enrolledCourses.map(enrollment => {
      const quizScores = enrollment.quizScores || [];
      const avgQuizScore = quizScores.length > 0 
        ? Math.round(quizScores.reduce((sum, score) => sum + (score.score || 0), 0) / quizScores.length)
        : 0;
      
      return {
        course: enrollment.course,
        enrolledAt: enrollment.enrolledAt,
        avgQuizScore: avgQuizScore,
        completedQuizzes: quizScores.length,
        highestScore: quizScores.length > 0 
          ? Math.max(...quizScores.map(score => score.score || 0))
          : 0
      };
    });

    // Calculate weekly learning minutes from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyProgress = student.studentProgress.filter(progress => 
      new Date(progress.date) >= sevenDaysAgo
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalWeeklyMinutes = weeklyProgress.reduce((sum, day) => sum + (day.minutes || 0), 0);

    // Prepare response data
    const responseData = {
      ...student.toObject(),
      enrolledCourses: enrolledCoursesWithStats,
      dashboardStats: {
        totalEnrolledCourses: enrolledCoursesWithStats.length,
        currentStreak: student.streak || 0,
        totalWeeklyMinutes: totalWeeklyMinutes,
        totalQuizzesTaken: enrolledCoursesWithStats.reduce((sum, course) => sum + course.completedQuizzes, 0),
        globalQuizAverage: enrolledCoursesWithStats.length > 0
          ? Math.round(enrolledCoursesWithStats.reduce((sum, course) => sum + course.avgQuizScore, 0) / enrolledCoursesWithStats.length)
          : 0,
        highestQuizScore: Math.max(...enrolledCoursesWithStats.map(course => course.highestScore), 0)
      }
    };

    res.json({
      message: "Student profile retrieved successfully",
      data: responseData,
      success: true,
      error: false,
    });
  } catch (error) {
    console.log("err occured...", error);
    res.status(500).json({
      message: error?.message || error,
      success: false,
      error: true,
    });
  }
}

async function updateEnrollCourses(req, res) {
  console.log(req.body);
  const { courseIds } = req.body;
  console.log(courseIds);
  const studentId = req.user._id;
  try {
    // Convert courseIds to the new format
    const enrolledCoursesData = courseIds.map((courseId) => ({
      course: courseId,
      enrolledAt: new Date(),
      quizScores: [],
    }));

    const student = await Student.findById(studentId);
    
    // Get existing course IDs to avoid duplicates
    const existingCourseIds = student.enrolledCourses.map(
      (ec) => ec.course.toString()
    );

    // Filter out already enrolled courses
    const newCourses = enrolledCoursesData.filter(
      (ec) => !existingCourseIds.includes(ec.course.toString())
    );

    // Add new courses
    student.enrolledCourses.push(...newCourses);
    await student.save();

    res.json({
      message: "Student courses updated successfully",
      data: student,
      success: true,
      error: false,
    });
  } catch (error) {
    console.log("err occured...", error);
    res.json({
      message: error?.message || error,
      success: false,
      error: true,
    });
  }
}

async function getCoursesByStudentId(req, res) {
  const courses = await Course.find({ students: req.user._id }).populate({
    path: "teacher",
    select: "name",
  });

  res.json({
    message: "Student courses retrieved successfully",
    data: courses,
    success: true,
    error: false,
  });
}

// Get all courses for students to browse
async function getAllCourses(req, res) {
  try {
    const courses = await Course.find().populate("teacher", "name email");
    res.json({
      message: "Courses retrieved successfully",
      data: courses,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      message: "Error fetching courses",
      success: false,
      error: true,
    });
  }
}

// Get a specific course by ID
async function getCourseById(req, res) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate(
      "teacher",
      "name email"
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
        success: false,
        error: true,
      });
    }

    // compute rating summary
    const ratings = course.ratings || [];
    const ratingCount = ratings.length;
    const avg = ratingCount
      ? Math.round((ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratingCount) * 10) / 10
      : 0;

    res.json({
      message: "Course retrieved successfully",
      data: { ...course.toObject(), rating: { average: avg, count: ratingCount } },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      message: "Error fetching course",
      success: false,
      error: true,
    });
  }
}

// Enroll student in a course
async function enrollInCourse(req, res) {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id; // from JWT token

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
        success: false,
        error: true,
      });
    }

    // Check if student is already enrolled
    if (course.students.includes(studentId)) {
      return res.json({
        message: "You are already enrolled in this course",
        success: false,
        error: true,
      });
    }

    // Add student to course
    course.students.push(studentId);
    await course.save();

    res.json({
      message: "Successfully enrolled in course",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({
      message: "Error enrolling in course",
      success: false,
      error: true,
    });
  }
}

// Get enrolled courses for a student
async function getEnrolledCourses(req, res) {
  try {
    const studentId = req.user._id; // from JWT token

    const courses = await Course.find({ students: studentId }).populate(
      "teacher",
      "name email"
    );

    res.json({
      message: "Enrolled courses retrieved successfully",
      data: courses,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({
      message: "Error fetching enrolled courses",
      success: false,
      error: true,
    });
  }
}

async function getStudentMyCourses(req, res) {
  try {
    const studentId = req.user._id;

    const student = await Student.findById(studentId).populate({
      path: "enrolledCourses.course",
      select: "title description price image category level teacher chapters",
      populate: {
        path: "teacher",
        select: "name email",
      },
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        success: false,
        error: true,
      });
    }

    // Extract just the course data from enrolledCourses
    const courses = student.enrolledCourses.map(enrollment => ({
      ...enrollment.course.toObject(),
      enrolledAt: enrollment.enrolledAt,
      quizScores: enrollment.quizScores,
      completedTopics: enrollment.completedTopics,
    }));

    res.json({
      message: "My courses retrieved successfully",
      data: courses,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error fetching my courses:", error);
    res.status(500).json({
      message: "Error fetching my courses",
      success: false,
      error: true,
    });
  }
}

async function quizSubmission(req, res) {
  try {
    const { courseId, chapterId, topicId, answerQuiz } = req.body;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);
    const originalQuiz = course.chapters.id(chapterId).topics.id(topicId).quiz;

    let correct = 0;
    const quiz = originalQuiz.map((q) => {
      const ansObj = answerQuiz.find(
        (ansObj) => ansObj.question === q.question
      );
      console.log("ansObj", ansObj);
      const isCorrect = ansObj && ansObj.tickOption === q.correctOption;
      if (isCorrect) correct++;

      return {
        questionText: q.question,
        options: q.options,
        tickOption: ansObj ? ansObj.tickOption : null,
        correctOption: q.correctOption,
        isCorrect,
        explaination: q.explaination,
      };
    });

    // 1. Calculate the new score for this specific quiz attempt
    const scorePercentage = Math.round((correct / originalQuiz.length) * 100);
    const score = `${scorePercentage}%`;

    const submission = new QuizSubmission({
      studentId,
      courseId,
      chapterId,
      topicId,
      quiz,
      correct,
      totalQuestions: originalQuiz.length,
      score,
    });
    const data = await submission.save();

    // 2. Update the Student's enrolled course record
    const student = await Student.findById(studentId);
    if (student) {
      const enrolledCourse = student.enrolledCourses.find(
        (item) => item.course && item.course.toString() === courseId
      );

      if (enrolledCourse) {
        // Add this quiz score to the quizScores array
        enrolledCourse.quizScores.push({
          chapterId,
          topicId,
          score: scorePercentage, // Store as number, not string with %
          totalQuestions: originalQuiz.length,
          submittedAt: new Date()
        });

        // Recalculate average from all quiz scores in this course
        const quizScores = enrolledCourse.quizScores;
        if (quizScores.length > 0) {
          const totalScore = quizScores.reduce((acc, curr) => acc + (curr.score || 0), 0);
          enrolledCourse.avgQuizScore = Math.round(totalScore / quizScores.length);
          enrolledCourse.completedQuizzes = quizScores.length;
        }

        await student.save();
      }
    }

    res.json({
      message: "Quiz submitted successfully",
      data: data,
      success: true,
      error: false,
    });
  } catch (error) {
    console.log("error occured...", error);
    res.json({
      message: error,
      success: false,
      error: true,
    });
  }
}

// Get all quiz submissions for the current student and aggregate by course
async function getQuizSubmissions(req, res) {
  try {
    const studentId = req.user._id;

    const submissions = await QuizSubmission.find({ studentId }).lean();

    // Group by courseId
    const grouped = {};
    submissions.forEach((s) => {
      const cid = s.courseId ? s.courseId.toString() : "unknown";
      if (!grouped[cid]) grouped[cid] = [];
      grouped[cid].push(s);
    });

    const courseIds = Object.keys(grouped).filter((id) => id !== "unknown");
    const courses = await Course.find({ _id: { $in: courseIds } }).select(
      "_id title"
    );
    const courseMap = {};
    courses.forEach((c) => (courseMap[c._id.toString()] = c.title));

    const perCourse = Object.entries(grouped).map(([courseId, subs]) => {
      // compute average numeric score and latest score
      const scores = subs.map(
        (s) => parseInt((s.score || "0").toString().replace("%", "")) || 0
      );
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      const latest = subs.sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      )[0];

      return {
        courseId: courseId === "unknown" ? null : courseId,
        courseTitle: courseMap[courseId] || null,
        attempts: subs.length,
        averageScore: `${avg}%`,
        latestScore: latest ? latest.score : null,
        lastAttemptAt: latest ? latest.submittedAt : null,
      };
    });

    return res.json({ success: true, data: perCourse });
  } catch (error) {
    console.error("getQuizSubmissions error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not fetch quiz submissions" });
  }
}

// Get streak and simple activity analytics for current student
async function getStreakStats(req, res) {
  try {
    const studentId = req.user._id;

    const student = await Student.findById(studentId).select(
      "streak bestStreak lastActiveDateStreak studentProgress"
    );

    // Count unique dates when the student submitted quizzes
    const submissions = await QuizSubmission.find({ studentId }).select(
      "submittedAt"
    );

    const uniqueQuizDates = new Set();
    submissions.forEach((s) => {
      const d = new Date(s.submittedAt);
      // ISO date (YYYY-MM-DD) to dedupe per-day
      uniqueQuizDates.add(d.toISOString().slice(0, 10));
    });

    const quizDays = uniqueQuizDates.size;

    // Count unique active days from student progress (learning sessions) + quiz days
    const uniqueActiveDates = new Set();
    
    // Add quiz submission dates
    submissions.forEach((s) => {
      const d = new Date(s.submittedAt);
      uniqueActiveDates.add(d.toISOString().slice(0, 10));
    });
    
    // Add student progress dates (learning session dates)
    if (student.studentProgress && student.studentProgress.length > 0) {
      student.studentProgress.forEach((progress) => {
        const d = new Date(progress.date);
        uniqueActiveDates.add(d.toISOString().slice(0, 10));
      });
    }
    
    // If student has lastActiveDateStreak, include that as well
    if (student.lastActiveDateStreak) {
      const d = new Date(student.lastActiveDateStreak);
      uniqueActiveDates.add(d.toISOString().slice(0, 10));
    }

    const activeDays = uniqueActiveDates.size;

    return res.json({
      success: true,
      data: {
        currentStreak: student?.streak || 0,
        bestStreak: student?.bestStreak || 0,
        lastActiveDate: student?.lastActiveDateStreak || null,
        quizDays,
        activeDays,
      },
    });
  } catch (error) {
    console.error("getStreakStats error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not fetch streak stats" });
  }
}

async function studentProgress(req, res) {
  try {
    // Handle both JSON and query params (for navigator.sendBeacon)
    let minutes;
    let studentId;
    
    // Check if minutes is in body or query
    if (req.body && req.body.minutes) {
      minutes = req.body.minutes;
    } else if (req.query && req.query.minutes) {
      minutes = req.query.minutes;
    }
    
    // Convert to number if it's a string
    if (typeof minutes === 'string') {
      minutes = parseInt(minutes);
    }
    
    // Validate input
    if (!minutes || typeof minutes !== 'number' || minutes <= 0 || isNaN(minutes)) {
      console.error('Invalid minutes value:', req.body, req.query);
      return res.status(400).json({
        message: "Invalid minutes value",
        success: false,
        error: true,
      });
    }
    
    // Get student ID from req.user (set by verify middleware)
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Authentication required",
        success: false,
        error: true,
      });
    }
    
    studentId = req.user._id;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        success: false,
        error: true,
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const todayStudentProgress = student.studentProgress.find(
      (sp) => sp.date.toISOString().split("T")[0] === today
    );
    
    if (todayStudentProgress) {
      todayStudentProgress.minutes += minutes;
      console.log(`✅ Updated progress for ${student.name}: +${minutes} min (Total today: ${todayStudentProgress.minutes} min)`);
    } else {
      student.studentProgress.push({ 
        date: new Date(today), 
        minutes: minutes 
      });
      console.log(`✅ Created new progress entry for ${student.name}: ${minutes} min`);
    }

    await student.save();

    res.json({
      message: "Learning progress saved successfully",
      data: {
        totalMinutesToday: todayStudentProgress ? todayStudentProgress.minutes : minutes,
        date: today,
        studentName: student.name
      },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error saving student progress:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
      error: true,
    });
  }
}

async function getStudentProgress(req, res) {
  try {
    const studentId = req.user._id;
    const student = await Student.findById(studentId);

    res.json({
      message: "Student Progress retrieved successfully",
      data: student.studentProgress,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("error occured...", error);
    res.json({
      message: error.message || "internal server error",
      success: false,
      error: true,
    });
  }
}

// Helper function to update student streak
async function updateStudentStreak(studentId) {
  try {
    const student = await Student.findById(studentId);
    if (!student) return;

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    
    let currentStreak = student.streak || 0;
    let bestStreak = student.bestStreak || 0;
    
    if (student.lastActiveDateStreak) {
      const lastActiveDate = new Date(student.lastActiveDateStreak);
      const lastActiveDateString = lastActiveDate.toISOString().split('T')[0];
      
      if (lastActiveDateString === todayDateString) {
        // Already logged in today, no need to update
        return;
      }
      
      const timeDiff = today - lastActiveDate;
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day, increment streak
        currentStreak++;
      } else if (daysDiff > 1) {
        // Streak broken, reset to 1
        currentStreak = 1;
      }
    } else {
      // First time logging in
      currentStreak = 1;
    }
    
    // Update best streak if current is higher
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
    
    // Update student
    await Student.findByIdAndUpdate(studentId, {
      streak: currentStreak,
      bestStreak: bestStreak,
      lastActiveDateStreak: today,
      lastLogin: today
    });
    
  } catch (error) {
    console.error("Error updating student streak:", error);
  }
}

async function getStudentDashboard(req, res) {
  try {
    const studentId = req.user._id;
    
    // Update streak when accessing dashboard
    await updateStudentStreak(studentId);
    
    const student = await Student.findById(studentId).populate({
      path: "enrolledCourses.course",
      select: "title image price category level",
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        success: false,
        error: true,
      });
    }

    // Calculate quiz statistics for each enrolled course
    const enrolledCoursesWithStats = await Promise.all(student.enrolledCourses.map(async enrollment => {
      const quizScores = enrollment.quizScores || [];
      const avgQuizScore = quizScores.length > 0 
        ? Math.round(quizScores.reduce((sum, score) => sum + (score.score || 0), 0) / quizScores.length)
        : 0;
      
      // Get total topics for this course
      const totalTopics = await getTotalTopicsInCourse(enrollment.course._id);
      const completedTopicsCount = enrollment.completedTopics ? enrollment.completedTopics.length : 0;
      
      return {
        course: enrollment.course,
        enrolledAt: enrollment.enrolledAt,
        avgQuizScore: avgQuizScore,
        completedQuizzes: quizScores.length,
        highestScore: quizScores.length > 0 
          ? Math.max(...quizScores.map(score => score.score || 0))
          : 0,
        completedTopics: completedTopicsCount,
        totalTopics: totalTopics,
        completionPercentage: totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0
      };
    }));

    // Calculate weekly learning minutes from the last 7 days
    const today = new Date();
    const weeklyProgressData = [];
    let totalWeeklyMinutes = 0;
    
    // Create a complete 7-day array
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Find existing progress for this date
      const existingProgress = student.studentProgress.find(progress => {
        const progressDate = new Date(progress.date).toISOString().split('T')[0];
        return progressDate === dateString;
      });
      
      const minutes = existingProgress ? existingProgress.minutes : 0;
      totalWeeklyMinutes += minutes;
      
      weeklyProgressData.push({
        date: date,
        minutes: minutes
      });
    }
    
    const weeklyProgress = weeklyProgressData;

    // Get recent quiz submissions for additional stats
    const quizSubmissions = await QuizSubmission.find({ studentId }).sort({ submittedAt: -1 });
    
    // Calculate dashboard statistics
    const dashboardData = {
      studentInfo: {
        name: student.name,
        email: student.email,
        streak: student.streak || 0,
        bestStreak: student.bestStreak || 0,
        lastActiveDateStreak: student.lastActiveDateStreak
      },
      enrolledCourses: enrolledCoursesWithStats,
      studentProgress: weeklyProgress,
      dashboardStats: {
        totalEnrolledCourses: enrolledCoursesWithStats.length,
        currentStreak: student.streak || 0,
        totalWeeklyMinutes: totalWeeklyMinutes,
        totalQuizzesTaken: enrolledCoursesWithStats.reduce((sum, course) => sum + course.completedQuizzes, 0),
        globalQuizAverage: enrolledCoursesWithStats.length > 0
          ? Math.round(enrolledCoursesWithStats.reduce((sum, course) => sum + course.avgQuizScore, 0) / enrolledCoursesWithStats.length)
          : 0,
        highestQuizScore: Math.max(...enrolledCoursesWithStats.map(course => course.highestScore), 0),
        totalQuizSubmissions: quizSubmissions.length,
        totalCompletedTopics: enrolledCoursesWithStats.reduce((sum, course) => sum + course.completedTopics, 0),
        totalTopics: enrolledCoursesWithStats.reduce((sum, course) => sum + course.totalTopics, 0),
        overallCompletionPercentage: enrolledCoursesWithStats.length > 0 
          ? Math.round(enrolledCoursesWithStats.reduce((sum, course) => sum + course.completionPercentage, 0) / enrolledCoursesWithStats.length)
          : 0,
        recentActivity: student.studentProgress.slice(-7) // Last 7 days of activity
      }
    };

    res.json({
      message: "Student dashboard data retrieved successfully",
      data: dashboardData,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      message: error?.message || "Error fetching dashboard data",
      success: false,
      error: true,
    });
  }
}

async function markTopicComplete(req, res) {
  try {
    const { courseId, chapterId, topicId } = req.body;
    const studentId = req.user._id;

    // Validate required fields
    if (!courseId || !chapterId || !topicId) {
      return res.status(400).json({
        message: "Course ID, Chapter ID, and Topic ID are required",
        success: false,
        error: true,
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        success: false,
        error: true,
      });
    }

    // Find the enrolled course
    const enrolledCourse = student.enrolledCourses.find(
      (ec) => ec.course.toString() === courseId
    );

    if (!enrolledCourse) {
      return res.status(404).json({
        message: "Student not enrolled in this course",
        success: false,
        error: true,
      });
    }

    // Check if topic is already completed
    const isAlreadyCompleted = enrolledCourse.completedTopics.some(
      (ct) => ct.chapterId.toString() === chapterId && ct.topicId.toString() === topicId
    );

    if (isAlreadyCompleted) {
      return res.json({
        message: "Topic already marked as complete",
        success: true,
        error: false,
        data: { alreadyCompleted: true }
      });
    }

    // Add to completed topics
    enrolledCourse.completedTopics.push({
      chapterId,
      topicId,
      completedAt: new Date()
    });

    await student.save();

    res.json({
      message: "Topic marked as complete successfully",
      success: true,
      error: false,
      data: {
        completedTopics: enrolledCourse.completedTopics.length,
        totalTopics: await getTotalTopicsInCourse(courseId)
      }
    });
  } catch (error) {
    console.error("Error marking topic as complete:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
      error: true,
    });
  }
}

async function getTopicCompletionStatus(req, res) {
  try {
    const { courseId, chapterId, topicId } = req.query;
    const studentId = req.user._id;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
        success: false,
        error: true,
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        success: false,
        error: true,
      });
    }

    const enrolledCourse = student.enrolledCourses.find(
      (ec) => ec.course.toString() === courseId
    );

    if (!enrolledCourse) {
      return res.status(404).json({
        message: "Student not enrolled in this course",
        success: false,
        error: true,
      });
    }

    let completionData = {};

    if (chapterId && topicId) {
      // Check specific topic
      const isCompleted = enrolledCourse.completedTopics.some(
        (ct) => ct.chapterId.toString() === chapterId && ct.topicId.toString() === topicId
      );
      completionData = { isCompleted };
    } else {
      // Get all completed topics for the course
      completionData = {
        completedTopics: enrolledCourse.completedTopics,
        totalCompleted: enrolledCourse.completedTopics.length
      };
    }

    res.json({
      message: "Topic completion status retrieved successfully",
      success: true,
      error: false,
      data: completionData
    });
  } catch (error) {
    console.error("Error getting topic completion status:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
      error: true,
    });
  }
}

// Helper function to count total topics in a course
async function getTotalTopicsInCourse(courseId) {
  try {
    const course = await Course.findById(courseId);
    if (!course) return 0;
    
    return course.chapters.reduce((total, chapter) => {
      return total + (chapter.topics ? chapter.topics.length : 0);
    }, 0);
  } catch (error) {
    console.error("Error counting topics:", error);
    return 0;
  }
}

module.exports = {
  getStudents,
  studentProfile,
  getStudentDashboard,
  getAllCourses,
  getCourseById,
  enrollInCourse,
  getEnrolledCourses,
  getStudentMyCourses,
  getQuizSubmissions,
  quizSubmission,
  getCoursesByStudentId,
  updateEnrollCourses,
  // Streak / analytics for a student
  getStreakStats,
  studentProgress,
  getStudentProgress,
  // Topic completion
  markTopicComplete,
  getTopicCompletionStatus,
};
