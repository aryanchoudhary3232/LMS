const Course = require("../models/Course");
const Student = require("../models/Student");
const Discussion = require("../models/Discussion");
const Reply = require("../models/Reply");

function getActorFromUser(user) {
  if (!user || !user._id || !user.role) return null;

  if (user.role === "Student") {
    return { author: user._id, authorModel: "Student" };
  }

  if (user.role === "Teacher") {
    return { author: user._id, authorModel: "Teacher" };
  }

  return null;
}

function findTopicInsideCourse(course, topicId) {
  if (!course || !Array.isArray(course.chapters)) return null;

  for (const chapter of course.chapters) {
    const topics = Array.isArray(chapter.topics) ? chapter.topics : [];
    const topic = topics.find((item) => item?._id?.toString() === topicId.toString());
    if (topic) {
      return {
        chapterId: chapter?._id || null,
        topicId: topic._id,
      };
    }
  }

  return null;
}

async function canAccessTopicDiscussion({ courseId, topicId, user }) {
  const actor = getActorFromUser(user);
  if (!actor) {
    return { allowed: false, status: 403, message: "Only students and teachers can access discussions" };
  }

  const course = await Course.findById(courseId).select("teacher students chapters");
  if (!course) {
    return { allowed: false, status: 404, message: "Course not found" };
  }

  const topic = findTopicInsideCourse(course, topicId);
  if (!topic) {
    return { allowed: false, status: 404, message: "Topic not found in this course" };
  }

  if (actor.authorModel === "Teacher") {
    const isCourseTeacher = course.teacher?.toString() === user._id.toString();
    if (!isCourseTeacher) {
      return { allowed: false, status: 403, message: "Only the course teacher can access this discussion" };
    }
  }

  if (actor.authorModel === "Student") {
    const existsInCourseStudents = (course.students || []).some(
      (studentId) => studentId?.toString() === user._id.toString(),
    );

    let isEnrolled = existsInCourseStudents;

    if (!isEnrolled) {
      const student = await Student.findById(user._id).select("enrolledCourses.course");
      isEnrolled = (student?.enrolledCourses || []).some(
        (enrollment) => enrollment?.course?.toString() === courseId.toString(),
      );
    }

    if (!isEnrolled) {
      return { allowed: false, status: 403, message: "Only enrolled students can access this discussion" };
    }
  }

  return { allowed: true, actor, course, topic };
}

function parsePagination(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  if (max && parsed > max) return max;
  return Math.floor(parsed);
}

async function getTopicDiscussions(req, res) {
  try {
    const { courseId, topicId } = req.params;
    const page = parsePagination(req.query.page, 1);
    const limit = parsePagination(req.query.limit, 10, 50);

    const access = await canAccessTopicDiscussion({
      courseId,
      topicId,
      user: req.user,
    });

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    const filter = { course: courseId, topicId };
    const skip = (page - 1) * limit;

    const [total, discussions] = await Promise.all([
      Discussion.countDocuments(filter),
      Discussion.find(filter)
        .sort({ isResolved: 1, lastActivityAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name role")
        .lean(),
    ]);

    const discussionIds = discussions.map((discussion) => discussion._id);
    let repliesByDiscussion = {};

    if (discussionIds.length > 0) {
      const replies = await Reply.find({ discussion: { $in: discussionIds } })
        .sort({ isAcceptedAnswer: -1, createdAt: 1 })
        .populate("author", "name role")
        .lean();

      repliesByDiscussion = replies.reduce((acc, reply) => {
        const key = reply.discussion.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(reply);
        return acc;
      }, {});
    }

    const data = discussions.map((discussion) => ({
      ...discussion,
      replies: repliesByDiscussion[discussion._id.toString()] || [],
    }));

    res.json({
      success: true,
      message: "Discussions fetched successfully",
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get discussions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching discussions",
    });
  }
}

async function createDiscussion(req, res) {
  try {
    const { courseId, topicId } = req.params;
    const title = req.body?.title?.trim();
    const content = req.body?.content?.trim();

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const access = await canAccessTopicDiscussion({
      courseId,
      topicId,
      user: req.user,
    });

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    const created = await Discussion.create({
      course: courseId,
      chapterId: access.topic.chapterId,
      topicId: access.topic.topicId,
      author: access.actor.author,
      authorModel: access.actor.authorModel,
      title,
      content,
      lastActivityAt: new Date(),
    });

    const populatedDiscussion = await Discussion.findById(created._id)
      .populate("author", "name role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Discussion created successfully",
      data: populatedDiscussion,
    });
  } catch (error) {
    console.error("Create discussion error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating discussion",
    });
  }
}

async function createDiscussionReply(req, res) {
  try {
    const { courseId, topicId, discussionId } = req.params;
    const content = req.body?.content?.trim();

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    const access = await canAccessTopicDiscussion({
      courseId,
      topicId,
      user: req.user,
    });

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    const discussion = await Discussion.findOne({
      _id: discussionId,
      course: courseId,
      topicId,
    });

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const reply = await Reply.create({
      discussion: discussion._id,
      author: access.actor.author,
      authorModel: access.actor.authorModel,
      content,
    });

    await Discussion.findByIdAndUpdate(discussion._id, {
      $inc: { replyCount: 1 },
      $set: { lastActivityAt: new Date() },
    });

    const populatedReply = await Reply.findById(reply._id)
      .populate("author", "name role")
      .lean();

    res.status(201).json({
      success: true,
      message: "Reply posted successfully",
      data: populatedReply,
    });
  } catch (error) {
    console.error("Create discussion reply error:", error);
    res.status(500).json({
      success: false,
      message: "Error posting reply",
    });
  }
}

async function updateDiscussionResolution(req, res) {
  try {
    const { courseId, topicId, discussionId } = req.params;
    const { isResolved } = req.body || {};

    if (typeof isResolved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isResolved must be boolean",
      });
    }

    const access = await canAccessTopicDiscussion({
      courseId,
      topicId,
      user: req.user,
    });

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    const discussion = await Discussion.findOne({
      _id: discussionId,
      course: courseId,
      topicId,
    });

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const isDiscussionAuthor = discussion.author?.toString() === req.user._id.toString();
    const isCourseTeacher =
      req.user.role === "Teacher" && access.course.teacher?.toString() === req.user._id.toString();

    if (!isDiscussionAuthor && !isCourseTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only the course teacher or discussion author can update status",
      });
    }

    discussion.isResolved = isResolved;
    discussion.lastActivityAt = new Date();
    await discussion.save();

    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate("author", "name role")
      .lean();

    res.json({
      success: true,
      message: "Discussion status updated",
      data: populatedDiscussion,
    });
  } catch (error) {
    console.error("Update discussion resolution error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating discussion",
    });
  }
}

module.exports = {
  getTopicDiscussions,
  createDiscussion,
  createDiscussionReply,
  updateDiscussionResolution,
};