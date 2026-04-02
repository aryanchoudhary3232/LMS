const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

const Admin = require("../models/Admin");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Flashcard = require("../models/Flashcard");
const QuizSubmission = require("../models/QuizSubmission");

dotenv.config();

const MONGO_URL = process.env.MONGO_URL_ATLAS || process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error(
    "Missing Mongo connection string. Set MONGO_URL or MONGO_URL_ATLAS.",
  );
  process.exit(1);
}

const pickVideo = (pool, index) => {
  if (!pool.length) return "";
  return pool[index % pool.length];
};

const pickImage = (pool, index) => {
  if (!pool.length) return "";
  return pool[index % pool.length];
};

const getPublicAssetBase = () => {
  const base =
    process.env.PUBLIC_ASSET_URL ||
    process.env.BACKEND_URL ||
    `http://localhost:${process.env.PORT || 3000}`;

  return base.replace(/\/$/, "");
};

const loadPublicImages = (baseUrl) => {
  const publicDir = path.resolve(__dirname, "../../FRONTEND/public");
  const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
  const images = [];

  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        return;
      }

      if (!allowedExt.has(path.extname(entry.name).toLowerCase())) return;
      const relativePath = path
        .relative(publicDir, fullPath)
        .split(path.sep)
        .join("/");

      images.push(`${baseUrl}/public/${relativePath}`);
    });
  };

  try {
    if (!fs.existsSync(publicDir)) return [];
    walk(publicDir);
    return images;
  } catch (err) {
    console.warn("⚠️  Unable to read public images:", err.message);
    return [];
  }
};

const buildQuiz = (topic, offset) => [
  {
    question: `What is the main goal of ${topic}?`,
    options: [
      `Understand the fundamentals of ${topic}`,
      `Skip the basics of ${topic}`,
      `Avoid practicing ${topic}`,
      `Only memorize ${topic} terms`,
    ],
    correctOption: `Understand the fundamentals of ${topic}`,
    explaination: `Mastering the fundamentals of ${topic} builds strong recall and application.`,
  },
  {
    question: `Which step comes next after learning ${topic} concepts?`,
    options: [
      "Apply the concepts with examples",
      "Ignore feedback",
      "Stop practicing",
      "Avoid assessments",
    ],
    correctOption: "Apply the concepts with examples",
    explaination:
      "Applying concepts builds confidence and long-term retention.",
  },
  {
    question: `A strong outcome of ${topic} practice is:`,
    options: [
      "Clear problem-solving workflow",
      "Random guessing",
      "No improvement",
      "Skipping revisions",
    ],
    correctOption: "Clear problem-solving workflow",
    explaination:
      "Structured practice leads to consistent results and clarity.",
  },
];

const courseTemplates = {
  "Full Stack Web Development": [
    {
      title: "Web Fundamentals",
      topics: ["HTML Semantics", "CSS Layouts", "JavaScript Essentials"],
    },
    {
      title: "Frontend Engineering",
      topics: ["React Components", "State and Hooks", "Routing and Data"],
    },
    {
      title: "Backend APIs",
      topics: ["Node and Express", "REST API Design", "MongoDB Basics"],
    },
    {
      title: "Production Ready",
      topics: ["Authentication", "Deployment and Monitoring"],
    },
  ],
  "Data Analytics with Python": [
    {
      title: "Data Preparation",
      topics: [
        "Pandas Foundations",
        "Cleaning and Wrangling",
        "Exploratory Analysis",
      ],
    },
    {
      title: "Visualization",
      topics: [
        "Matplotlib Essentials",
        "Seaborn Insights",
        "Dashboard Storytelling",
      ],
    },
    {
      title: "Statistics and Models",
      topics: ["Descriptive Statistics", "Regression Basics"],
    },
    {
      title: "Business Reporting",
      topics: ["KPI Design", "Insight Narratives"],
    },
  ],
  "Digital Marketing Mastery": [
    {
      title: "Growth Strategy",
      topics: ["Audience Personas", "Funnel Planning", "Channel Mix"],
    },
    {
      title: "Acquisition",
      topics: ["SEO Fundamentals", "Paid Media", "Social Campaigns"],
    },
    {
      title: "Content and Retention",
      topics: ["Copywriting", "Email Automation"],
    },
    { title: "Analytics", topics: ["Attribution", "A/B Testing"] },
  ],
  "Product Management Foundations": [
    { title: "Discovery", topics: ["Problem Framing", "User Research"] },
    { title: "Planning", topics: ["Roadmapping", "Prioritization"] },
    { title: "Execution", topics: ["Agile Delivery", "Stakeholder Alignment"] },
    { title: "Growth", topics: ["Metrics and OKRs", "Experiment Design"] },
  ],
  "UI/UX Design Sprint": [
    { title: "Research", topics: ["User Interviews", "Personas and Journeys"] },
    { title: "Design", topics: ["Wireframes", "Design Systems"] },
    { title: "Prototype", topics: ["Figma Prototyping", "Usability Testing"] },
    { title: "Handoff", topics: ["Specs and QA", "Accessibility"] },
  ],
};

const buildCourseChapters = (courseTitle, videoPool, seedIndex) => {
  const template = courseTemplates[courseTitle] || [
    { title: "Foundations", topics: ["Core Concepts", "Tools and Workflow"] },
    { title: "Deep Dive", topics: ["Applied Strategy", "Common Pitfalls"] },
    { title: "Capstone", topics: ["Project Brief", "Deliverable Review"] },
  ];

  let videoIndex = seedIndex;
  return template.map((chapter) => ({
    title: chapter.title,
    topics: chapter.topics.map((topicTitle) => {
      const quiz = buildQuiz(topicTitle, videoIndex);
      const topic = {
        title: topicTitle,
        video: pickVideo(videoPool, videoIndex),
        quiz,
      };
      videoIndex += 1;
      return topic;
    }),
  }));
};

const main = async () => {
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to MongoDB");

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map((collection) => collection.name);

  let videoPool = [];
  let imagePool = [];
  if (collectionNames.includes("courses")) {
    const existingCourses = await Course.find({}).lean();
    const videoSet = new Set();
    const imageSet = new Set();

    existingCourses.forEach((course) => {
      if (course.video) videoSet.add(course.video);
      if (course.image) imageSet.add(course.image);
      if (course.chapters?.length) {
        course.chapters.forEach((chapter) => {
          chapter.topics?.forEach((topic) => {
            if (topic.video) videoSet.add(topic.video);
          });
        });
      }
    });

    videoPool = Array.from(videoSet);
    imagePool = Array.from(imageSet);
  }

  console.log(`🎞️  Found ${videoPool.length} existing video URL(s).`);

  const publicAssetBase = getPublicAssetBase();
  const publicImagePool = loadPublicImages(publicAssetBase);
  if (publicImagePool.length) {
    imagePool = publicImagePool;
    console.log(
      `🖼️  Found ${publicImagePool.length} public image(s). Using them for course images.`,
    );
  } else {
    console.log(`🖼️  Found ${imagePool.length} existing image URL(s).`);
  }

  for (const name of collectionNames) {
    if (name.startsWith("system.")) continue;
    await mongoose.connection.db.dropCollection(name);
  }

  console.log("🧹 Dropped all collections.");

  const passwordHash = await bcrypt.hash("Password@123", 10);

  await Admin.create({
    name: "Platform Admin",
    email: "admin@seekhobharat.com",
    password: passwordHash,
    role: "Admin",
  });

  const teachers = await Teacher.insertMany([
    {
      name: "Aarav Mehta",
      email: "aarav.mehta@seekhobharat.com",
      password: passwordHash,
      role: "Teacher",
      verificationStatus: "Verified",
      qualificationDetails: {
        degree: "M.Tech in Computer Science",
        institution: "IIT Bombay",
        specialization: "Full Stack Engineering",
        experienceYears: 8,
        bio: "Full stack mentor focused on industry-ready skills and capstone projects.",
      },
    },
    {
      name: "Nisha Kapoor",
      email: "nisha.kapoor@seekhobharat.com",
      password: passwordHash,
      role: "Teacher",
      verificationStatus: "Pending",
      qualificationDoc: {
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        format: "pdf",
        bytes: 204800,
        uploadedAt: new Date(),
      },
      qualificationDetails: {
        degree: "MBA in Marketing",
        institution: "XLRI Jamshedpur",
        specialization: "Digital Growth",
        experienceYears: 6,
        bio: "Marketing strategist helping learners build real campaigns and portfolios.",
      },
    },
    {
      name: "Rohit Sharma",
      email: "rohit.sharma@seekhobharat.com",
      password: passwordHash,
      role: "Teacher",
      verificationStatus: "Pending",
      qualificationDoc: {
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        format: "pdf",
        bytes: 204800,
        uploadedAt: new Date(),
      },
      qualificationDetails: {
        degree: "M.Sc in Data Science",
        institution: "IIIT Hyderabad",
        specialization: "Analytics & AI",
        experienceYears: 7,
        bio: "Data science instructor specializing in applied analytics and ML pipelines.",
      },
    },
  ]);

  const students = await Student.insertMany([
    {
      name: "Isha Verma",
      email: "isha.verma@seekhobharat.com",
      password: passwordHash,
      role: "Student",
    },
    {
      name: "Kabir Joshi",
      email: "kabir.joshi@seekhobharat.com",
      password: passwordHash,
      role: "Student",
    },
    {
      name: "Ananya Das",
      email: "ananya.das@seekhobharat.com",
      password: passwordHash,
      role: "Student",
    },
    {
      name: "Vihaan Singh",
      email: "vihaan.singh@seekhobharat.com",
      password: passwordHash,
      role: "Student",
    },
    {
      name: "Meera Iyer",
      email: "meera.iyer@seekhobharat.com",
      password: passwordHash,
      role: "Student",
    },
    {
      name: "Arjun Nair",
      email: "arjun.nair@seekhobharat.com",
      password: passwordHash,
      role: "Student",
    },
    {
      name: "Rhea Gupta",
      email: "rhea.gupta@seekhobharat.com",
      password: passwordHash,
      role: "Student",
    },
  ]);

  const courseSeeds = [
    {
      title: "Full Stack Web Development",
      description:
        "Build responsive web apps with modern frontend and backend stacks.",
      category: "Development",
      level: "Beginner",
      duration: 480,
      price: 1999,
      image:
        "https://via.placeholder.com/640x360.png?text=Full+Stack+Web+Development",
      notes: "Includes labs, deployment checklist, and capstone review.",
      teacher: teachers[0]._id,
    },
    {
      title: "Data Analytics with Python",
      description:
        "Analyze, visualize, and present insights using real business datasets.",
      category: "Data Science",
      level: "Intermediate",
      duration: 360,
      price: 1799,
      image:
        "https://via.placeholder.com/640x360.png?text=Data+Analytics+with+Python",
      notes: "Hands-on notebooks and weekly insight reports.",
      teacher: teachers[2]._id,
    },
    {
      title: "Digital Marketing Mastery",
      description: "Run SEO, paid, and content campaigns with measurable KPIs.",
      category: "Marketing",
      level: "Beginner",
      duration: 300,
      price: 1499,
      image:
        "https://via.placeholder.com/640x360.png?text=Digital+Marketing+Mastery",
      notes: "Includes campaign templates and brand strategy toolkit.",
      teacher: teachers[1]._id,
    },
    {
      title: "Product Management Foundations",
      description:
        "Learn product discovery, roadmaps, and stakeholder alignment.",
      category: "Business",
      level: "Intermediate",
      duration: 240,
      price: 1899,
      image:
        "https://via.placeholder.com/640x360.png?text=Product+Management+Foundations",
      notes: "Case studies and reusable PRD templates.",
      teacher: teachers[0]._id,
    },
    {
      title: "UI/UX Design Sprint",
      description: "Design user journeys, wireframes, and polished prototypes.",
      category: "Design",
      level: "Beginner",
      duration: 210,
      price: 1599,
      image:
        "https://via.placeholder.com/640x360.png?text=UI%2FUX+Design+Sprint",
      notes: "Includes design critique sessions and UX checklists.",
      teacher: teachers[1]._id,
    },
  ];

  const courses = [];
  courseSeeds.forEach((seed, index) => {
    courses.push({
      ...seed,
      image: pickImage(imagePool, index) || seed.image,
      video: pickVideo(videoPool, index),
      chapters: buildCourseChapters(seed.title, videoPool, index * 3),
    });
  });

  const courseDocs = await Course.insertMany(courses);

  const teacherCourseMap = teachers.reduce((acc, teacher) => {
    acc[teacher._id.toString()] = [];
    return acc;
  }, {});

  courseDocs.forEach((course) => {
    teacherCourseMap[course.teacher.toString()].push(course._id);
  });

  await Promise.all(
    teachers.map((teacher) =>
      Teacher.updateOne(
        { _id: teacher._id },
        { $set: { courses: teacherCourseMap[teacher._id.toString()] } },
      ),
    ),
  );

  const assignments = courseDocs.map((course, index) => ({
    title: `Module ${index + 1} Applied Assignment`,
    description:
      "Submit a short project summary and key learnings for this module.",
    instructions:
      "Include objectives, approach, and measurable outcomes in the submission.",
    course: course._id,
    chapter: "Foundations",
    teacher: course.teacher,
    maxMarks: 100,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (7 + index)),
    allowLateSubmission: true,
    submissionType: "both",
    status: "active",
  }));

  await Assignment.insertMany(assignments);

  const flashcards = courseDocs.map((course, index) => ({
    courseId: course._id,
    createdBy: course.teacher,
    title: `${course.title} Key Concepts`,
    description: "Quick revision deck for the most important concepts.",
    cards: [
      {
        type: "qa",
        question: "What is the primary outcome of this module?",
        answer: "Clear understanding of the core concept and its application.",
        difficulty: "medium",
        tags: ["core", "revision"],
      },
      {
        type: "qa",
        question: "Which metric is most relevant to track progress?",
        answer: "A measurable KPI tied to the learning goal.",
        difficulty: "easy",
        tags: ["metrics"],
      },
      {
        type: "cloze",
        question: "Complete the statement",
        answer: "Practice leads to mastery.",
        clozeText: "Consistent practice leads to ___.",
        difficulty: "easy",
        tags: ["habit"],
      },
    ],
    isPublished: true,
    visibility: "course",
  }));

  await Flashcard.insertMany(flashcards);

  for (let i = 0; i < students.length; i++) {
    const firstCourse = courseDocs[i % courseDocs.length];
    const secondCourse = courseDocs[(i + 1) % courseDocs.length];

    await Student.updateOne(
      { _id: students[i]._id },
      {
        $push: {
          enrolledCourses: [
            { course: firstCourse._id },
            { course: secondCourse._id },
          ],
        },
      },
    );

    await Course.updateOne(
      { _id: firstCourse._id },
      { $addToSet: { students: students[i]._id } },
    );
    await Course.updateOne(
      { _id: secondCourse._id },
      { $addToSet: { students: students[i]._id } },
    );
  }

  const quizSubmissions = [];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const course = courseDocs[i % courseDocs.length];
    const chapter = course.chapters[0];
    const topic = chapter.topics[0];

    const quizPayload = topic.quiz.map((question, index) => {
      const isCorrect = index % 3 !== 0;
      const fallbackOption = question.options.find(
        (option) => option !== question.correctOption,
      );
      const tickOption = isCorrect
        ? question.correctOption
        : fallbackOption || question.options[0];

      return {
        questionText: question.question,
        options: question.options,
        tickOption,
        correctOption: question.correctOption,
        isCorrect,
        explaination: question.explaination,
      };
    });

    const correctCount = quizPayload.filter((item) => item.isCorrect).length;
    const totalQuestions = quizPayload.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    quizSubmissions.push({
      studentId: student._id,
      courseId: course._id,
      chapterId: chapter._id,
      topicId: topic._id,
      quiz: quizPayload,
      correct: `${correctCount}`,
      totalQuestions: `${totalQuestions}`,
      score: `${scorePercentage}%`,
    });

    await Student.updateOne(
      { _id: student._id, "enrolledCourses.course": course._id },
      {
        $push: {
          "enrolledCourses.$.quizScores": {
            chapterId: chapter._id,
            topicId: topic._id,
            score: scorePercentage,
            totalQuestions,
            submittedAt: new Date(),
          },
          "enrolledCourses.$.completedTopics": {
            chapterId: chapter._id,
            topicId: topic._id,
            completedAt: new Date(),
          },
        },
        $set: {
          "enrolledCourses.$.avgQuizScore": scorePercentage,
          "enrolledCourses.$.completedQuizzes": 1,
        },
      },
    );
  }

  if (quizSubmissions.length) {
    await QuizSubmission.insertMany(quizSubmissions);
  }

  const ratingPool = [5, 4, 5, 4, 5];
  for (let i = 0; i < courseDocs.length; i++) {
    const course = courseDocs[i];
    const ratingStudents = students.slice(0, 3);

    await Course.updateOne(
      { _id: course._id },
      {
        $push: {
          ratings: ratingStudents.map((student, index) => ({
            student: student._id,
            rating: ratingPool[(i + index) % ratingPool.length],
            review: "Well-structured course with practical examples.",
          })),
        },
      },
    );
  }

  console.log("✅ Seeded professional demo data.");
  if (!videoPool.length) {
    console.log(
      "⚠️  No existing video URLs were found. Video fields are empty.",
    );
  }
  if (!imagePool.length) {
    console.log(
      "⚠️  No existing image URLs were found. Using fallback images.",
    );
  }

  await mongoose.disconnect();
  console.log("✅ Disconnected from MongoDB");
};

main().catch((error) => {
  console.error("Seed failed:", error);
  mongoose.disconnect();
  process.exit(1);
});
