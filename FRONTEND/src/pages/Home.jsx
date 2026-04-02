import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/Home.css";
import heroImage from "../assets/hero-banner.png";

import {
  FaStar,
  FaUserFriends,
  FaBook,
  FaRegPlayCircle,
  FaRegListAlt,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaClipboardCheck,
  FaRegLightbulb,
  FaChartLine,
  FaMobileAlt,
  FaShieldAlt,
  FaHeadset,
  FaLayerGroup,
  FaPenFancy,
  FaVideo,
  FaBookOpen,
  FaTrophy,
  FaRegClock,
  FaGlobe,
  FaUsers,
  FaFileAlt,
  FaHandshake,
  FaCheckCircle,
} from "react-icons/fa";

const heroHighlights = [
  { icon: FaVideo, label: "Live + recorded classes" },
  { icon: FaClipboardCheck, label: "Quizzes and assignments" },
  { icon: FaRegLightbulb, label: "Doubt solving support" },
  { icon: FaMobileAlt, label: "Mobile-first learning" },
];

const trustItems = [
  "Board aligned tracks",
  "Skill focused learning",
  "Teacher verified content",
  "Projects and certificates",
  "Community study rooms",
];

const studentBenefits = [
  {
    icon: FaBookOpen,
    title: "Concept-first lessons",
    desc: "Video, notes, and practice in one flow.",
  },
  {
    icon: FaClipboardCheck,
    title: "Assignments and quizzes",
    desc: "Timed tests with instant feedback.",
  },
  {
    icon: FaTrophy,
    title: "Streaks and milestones",
    desc: "Daily goals and skill badges.",
  },
  {
    icon: FaChartLine,
    title: "Progress tracking",
    desc: "Know what to revise and what to master.",
  },
  {
    icon: FaUsers,
    title: "Peer learning",
    desc: "Study circles, discussions, and group tasks.",
  },
  {
    icon: FaRegClock,
    title: "Flexible schedule",
    desc: "Learn anytime with bite-sized modules.",
  },
];

const teacherBenefits = [
  {
    icon: FaChalkboardTeacher,
    title: "Course studio",
    desc: "Build courses with chapters, quizzes, and files.",
  },
  {
    icon: FaPenFancy,
    title: "Assessment builder",
    desc: "Create quizzes, rubrics, and auto checks.",
  },
  {
    icon: FaVideo,
    title: "Live + recorded",
    desc: "Host live sessions and upload recordings.",
  },
  {
    icon: FaFileAlt,
    title: "Assignment workflows",
    desc: "Collect submissions and review in one place.",
  },
  {
    icon: FaHandshake,
    title: "Transparent earnings",
    desc: "Clear revenue share and payout tracking.",
  },
  {
    icon: FaShieldAlt,
    title: "Class control",
    desc: "Moderation tools and safe classrooms.",
  },
];

const learningSteps = [
  {
    step: "01",
    title: "Discover",
    desc: "Find tracks by goal, board, or skill.",
    icon: FaGlobe,
  },
  {
    step: "02",
    title: "Learn",
    desc: "Short lessons with notes and examples.",
    icon: FaBookOpen,
  },
  {
    step: "03",
    title: "Practice",
    desc: "Quizzes, flashcards, and assignments.",
    icon: FaClipboardCheck,
  },
  {
    step: "04",
    title: "Showcase",
    desc: "Projects, certificates, and shareable results.",
    icon: FaTrophy,
  },
];

const platformPillars = [
  {
    icon: FaLayerGroup,
    title: "Structured paths",
    desc: "From basics to advanced with clear milestones.",
  },
  {
    icon: FaShieldAlt,
    title: "Safe by design",
    desc: "Verified teachers and secure data handling.",
  },
  {
    icon: FaHeadset,
    title: "Always-on support",
    desc: "Chat and email support for every learner.",
  },
  {
    icon: FaMobileAlt,
    title: "Fast on mobile",
    desc: "Optimized for phones and low bandwidth.",
  },
];

const testimonials = [
  {
    quote:
      "SeekhoBharat kept my prep organized with daily goals and clear progress.",
    name: "Aditi Sharma",
    role: "Student, Class 12",
  },
  {
    quote:
      "The teacher studio makes it easy to build quizzes and track submissions.",
    name: "Ravi Singh",
    role: "Commerce Instructor",
  },
  {
    quote:
      "My course enrollments grew because the platform feels premium and simple.",
    name: "Neha Kulkarni",
    role: "Skill Trainer",
  },
];

function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: "--",
    instructors: "--",
    videos: "--",
    materials: "--",
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const fetchCourses = async () => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      // Try to fetch from /courses endpoint first, fallback to /student/courses
      let response = await fetch(`${backendUrl}/courses`);
      let data;

      // If /courses endpoint fails, try /student/courses
      if (!response.ok) {
        response = await fetch(`${backendUrl}/student/courses`);
      }

      data = await response.json();

      if (data.success) {
        // Sort courses by rating (highest first) and get top 3
        const sortedCourses = data.data.sort((a, b) => {
          const aRating = a.rating?.average || 0;
          const bRating = b.rating?.average || 0;
          return bRating - aRating;
        });
        setCourses(sortedCourses.slice(0, 3));
      } else {
        console.error("Failed to fetch courses:", data.message);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      // try a few likely endpoints for stats
      let response = await fetch(`${backendUrl}/stats`);
      if (!response.ok) {
        response = await fetch(`${backendUrl}/dashboard/stats`);
      }

      const data = await response.json();

      // Accept a few possible shapes for returned data
      if (data && (data.success || data.students || data.totalStudents)) {
        const payload = data.data || data;
        setStats({
          students:
            payload.students ||
            payload.studentCount ||
            payload.totalStudents ||
            "0",
          instructors:
            payload.instructors ||
            payload.teacherCount ||
            payload.totalInstructors ||
            "0",
          videos:
            payload.videos || payload.videoCount || payload.totalVideos || "0",
          materials:
            payload.materials ||
            payload.materialCount ||
            payload.totalMaterials ||
            "0",
        });
      } else {
        console.error("Failed to fetch stats:", data?.message || data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="home-container">
      <main>
        <section className="hero-section">
          <div className="hero-content animate-in">
            <span className="hero-badge">Bharat-first learning platform</span>
            <h1 className="hero-title">
              SeekhoBharat for students and teachers who want to grow faster
            </h1>
            <p className="hero-subtitle">
              Discover courses, build skills, and teach with confidence. Every
              tool you need to learn, practice, and teach lives in one place.
            </p>
            <div className="hero-actions">
              <Link to="/courses" className="btn btn-primary">
                Start learning
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/login" className="btn btn-ghost">
                Become a teacher
              </Link>
            </div>
            <div className="hero-highlights">
              {heroHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="hero-highlight">
                    <Icon className="hero-highlight-icon" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="hero-visual animate-in delay-1">
            <div className="hero-card">
              <img src={heroImage} alt="Learning experience" />
              <div className="hero-card-strip">
                <div>
                  <span className="hero-card-label">This week</span>
                  <strong className="hero-card-value">
                    {statsLoading ? "--" : stats.videos}
                  </strong>
                  <span className="hero-card-caption">New lessons</span>
                </div>
                <div>
                  <span className="hero-card-label">Learners</span>
                  <strong className="hero-card-value">
                    {statsLoading ? "--" : stats.students}
                  </strong>
                  <span className="hero-card-caption">Active students</span>
                </div>
              </div>
            </div>
            <div className="hero-float hero-float-left">
              <span>Top-rated teachers</span>
              <strong>{statsLoading ? "--" : stats.instructors}</strong>
            </div>
            <div className="hero-float hero-float-right">
              <span>Study resources</span>
              <strong>{statsLoading ? "--" : stats.materials}</strong>
            </div>
          </div>
        </section>

        <section className="trust-strip full-bleed">
          <div className="section-inner">
            <div className="trust-items">
              {trustItems.map((item) => (
                <span key={item} className="trust-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="stats-bar">
          <div className="stat-item">
            <FaUserFriends className="stat-icon" />
            <div className="stat-text">
              <strong>{statsLoading ? "Loading..." : stats.students}</strong>
              <span>Students</span>
            </div>
          </div>
          <div className="stat-item">
            <FaChalkboardTeacher className="stat-icon" />
            <div className="stat-text">
              <strong>{statsLoading ? "--" : stats.instructors}</strong>
              <span>Instructors</span>
            </div>
          </div>
          <div className="stat-item">
            <FaRegPlayCircle className="stat-icon" />
            <div className="stat-text">
              <strong>{statsLoading ? "--" : stats.videos}</strong>
              <span>Videos</span>
            </div>
          </div>
          <div className="stat-item">
            <FaRegListAlt className="stat-icon" />
            <div className="stat-text">
              <strong>{statsLoading ? "--" : stats.materials}</strong>
              <span>Materials</span>
            </div>
          </div>
        </section>

        <section className="role-section section">
          <div className="section-heading">
            <span className="section-eyebrow">For every role</span>
            <h2 className="section-title">
              Everything students and teachers need to succeed
            </h2>
            <p className="section-subtitle">
              Build a learning journey and a teaching business on the same
              platform. SeekhoBharat keeps the experience smooth for both.
            </p>
          </div>
          <div className="role-grid">
            <div className="role-card">
              <div className="role-header">
                <div className="role-icon">
                  <FaGraduationCap />
                </div>
                <div>
                  <h3>Students</h3>
                  <p>Guided learning with clear milestones.</p>
                </div>
              </div>
              <ul className="role-list">
                <li>
                  <FaCheckCircle /> Personalized learning paths
                </li>
                <li>
                  <FaCheckCircle /> Doubt solving and mentor feedback
                </li>
                <li>
                  <FaCheckCircle /> Assignments, quizzes, and flashcards
                </li>
                <li>
                  <FaCheckCircle /> Progress dashboard and streaks
                </li>
              </ul>
              <div className="role-actions">
                <Link to="/courses" className="btn btn-primary">
                  Explore courses
                </Link>
                <Link to="/login" className="btn btn-ghost">
                  View dashboard
                </Link>
              </div>
            </div>
            <div className="role-card teacher">
              <div className="role-header">
                <div className="role-icon">
                  <FaChalkboardTeacher />
                </div>
                <div>
                  <h3>Teachers</h3>
                  <p>Deliver courses with confidence and control.</p>
                </div>
              </div>
              <ul className="role-list">
                <li>
                  <FaCheckCircle /> Course builder with chapters
                </li>
                <li>
                  <FaCheckCircle /> Live class scheduling and recordings
                </li>
                <li>
                  <FaCheckCircle /> Assignment reviews and grading tools
                </li>
                <li>
                  <FaCheckCircle /> Revenue tracking and student insights
                </li>
              </ul>
              <div className="role-actions">
                <Link to="/login" className="btn btn-primary">
                  Start teaching
                </Link>
                <Link to="/contact" className="btn btn-ghost">
                  Talk to the team
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="toolkit-section full-bleed">
          <div className="section-inner">
            <div className="section-heading light">
              <span className="section-eyebrow">Toolkit</span>
              <h2 className="section-title">
                Daily learning tools for students and smart controls for
                teachers
              </h2>
              <p className="section-subtitle">
                From streaks to submissions, everything is stitched together so
                you never lose momentum.
              </p>
            </div>
            <div className="toolkit-columns">
              <div className="toolkit-column">
                <div className="toolkit-title">
                  <h3>Student toolkit</h3>
                  <p>Stay consistent, track goals, and learn faster.</p>
                </div>
                <div className="toolkit-grid">
                  {studentBenefits.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="tool-card">
                        <div className="tool-icon">
                          <Icon />
                        </div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="toolkit-column">
                <div className="toolkit-title">
                  <h3>Teacher toolkit</h3>
                  <p>Launch, manage, and scale your classrooms.</p>
                </div>
                <div className="toolkit-grid">
                  {teacherBenefits.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="tool-card">
                        <div className="tool-icon">
                          <Icon />
                        </div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="learning-section section">
          <div className="section-heading">
            <span className="section-eyebrow">How it works</span>
            <h2 className="section-title">A simple learning loop</h2>
            <p className="section-subtitle">
              Students stay focused with a clear path from discovery to
              showcase.
            </p>
          </div>
          <div className="learning-steps">
            {learningSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="step-card">
                  <div className="step-header">
                    <span className="step-number">{item.step}</span>
                    <span className="step-icon">
                      <Icon />
                    </span>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="pillars-section section">
          <div className="section-heading">
            <span className="section-eyebrow">Why SeekhoBharat</span>
            <h2 className="section-title">Quality you can trust</h2>
            <p className="section-subtitle">
              Built for Bharat with a focus on consistency, safety, and
              outcomes.
            </p>
          </div>
          <div className="pillar-grid">
            {platformPillars.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="pillar-card">
                  <div className="pillar-icon">
                    <Icon />
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="courses-section full-bleed">
          <div className="section-inner">
            <div className="courses-header">
              <div>
                <span className="section-eyebrow">Top picks</span>
                <h2>Popular Courses</h2>
              </div>
              <Link to="/courses" className="view-all-link">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="loading-message">Loading amazing courses...</div>
            ) : (
              <div className="courses-grid">
                {courses.length > 0 ? (
                  courses.map((course, index) => {
                    const courseLink = course._id
                      ? `/courses/${course._id}`
                      : "/courses";
                    return (
                      <div key={course._id || index} className="course-card">
                        <div className="course-image-wrapper">
                          <img
                            src={
                              course.image ||
                              `https://via.placeholder.com/350x200.png?text=${encodeURIComponent(
                                course.title,
                              )}`
                            }
                            alt={course.title}
                            className="course-image"
                            onError={(e) =>
                              (e.target.src =
                                "https://via.placeholder.com/350x200.png?text=No+Image")
                            }
                          />
                        </div>

                        <div className="course-content">
                          <div className="course-rating">
                            <FaStar className="star-icon" />
                            {course.rating?.average || "0"} (
                            {course.rating?.count || "0"} reviews)
                          </div>

                          <h3 className="course-title">{course.title}</h3>

                          <p className="course-instructor">
                            Member:{" "}
                            {course.teacher
                              ? course.teacher.name
                              : "Top Instructor"}
                          </p>

                          <div className="course-meta">
                            <span>
                              <FaBook /> {course.lessons || "12"} Lessons
                            </span>
                            <span>
                              <FaUserFriends /> {course.studentCount || "100+"}{" "}
                              Students
                            </span>
                          </div>

                          <div className="course-footer">
                            <span className="course-price">
                              {course.price ? `₹${course.price}` : "Free"}
                            </span>
                            <div className="course-actions">
                              <Link
                                to={courseLink}
                                className="btn btn-secondary"
                              >
                                View details
                              </Link>
                              <Link to={courseLink} className="btn btn-primary">
                                Enroll now
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-courses">No courses found.</div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="testimonial-section section">
          <div className="section-heading">
            <span className="section-eyebrow">Voices</span>
            <h2 className="section-title">Loved by learners and teachers</h2>
            <p className="section-subtitle">
              Real feedback from people building their future with SeekhoBharat.
            </p>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <div key={item.name} className="testimonial-card">
                <p className="testimonial-quote">"{item.quote}"</p>
                <div className="testimonial-user">
                  <div className="testimonial-avatar">
                    {item.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section full-bleed">
          <div className="section-inner">
            <div className="cta-banner">
              <div>
                <h2>Ready to learn or teach with SeekhoBharat?</h2>
                <p>
                  Join the platform that brings students and teachers together
                  with a premium learning experience.
                </p>
              </div>
              <div className="cta-actions">
                <Link to="/courses" className="btn btn-primary">
                  Start learning
                </Link>
                <Link to="/contact" className="btn btn-secondary">
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
