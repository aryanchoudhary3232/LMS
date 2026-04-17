import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
//common routes
import Login from "./pages/Login";
import Home from "./pages/Home";
import Courses from "./pages/Courses";

import CourseDetail from "./pages/CourseDetail";
import Checkout from "./pages/Checkout";

import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./helper/ProtectedRoute";
import Navbar from "./components/common/Navbar";
import Cart from "./components/student/Cart";
import Footer from "./components/common/Footer";
//student routes
import Student from "./components/student/Student";
import StudentHome from "./components/student/Home";
import StudentDashboard from "./components/student/StudentDashboard";
import StudentCourseDetail from "./components/student/CourseDetail";
import StudentQuiz from "./components/student/Quiz";
import StudentAssignments from "./components/student/assignments/StudentAssignments";
import SubmitAssignment from "./components/student/assignments/SubmitAssignment";
import ViewSubmission from "./components/student/assignments/ViewSubmission";
import Streak from "./components/student/Streak";
import StudentCourses from "./components/student/StudentCourses";
import StudentFlashcards from "./components/student/StudentFlashcards";
import StudentStudyDeck from "./components/student/StudentStudyDeck";
import StudentQuizHistory from "./components/student/StudentQuizHistory";
//teacher routes
import Teacher from "./components/teacher/Teacher";
import TeacherHome from "./components/teacher/Home";
import TeacherCourseDetail from "./components/teacher/CourseDetail";
import TeacherAddCourse from "./components/teacher/AddCourse";
import TeacherEditCourse from "./components/teacher/EditCourse";
import TeacherChapters from "./components/teacher/Chapters";
import TeacherQualificationUpload from "./components/teacher/TeacherQualificationUpload";
import TeacherAssignments from "./components/teacher/assignments/TeacherAssignments";
import CreateAssignment from "./components/teacher/assignments/CreateAssignment";
import AssignmentSubmissions from "./components/teacher/assignments/AssignmentSubmissions";
import TeacherAllCourses from "./components/teacher/TeacherAllCourses";
import TeacherFlashcards from "./components/teacher/flashcards/TeacherFlashcards";
//admin routes
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminUsers from "./components/admin/AdminUsers";
import AdminCourses from "./components/admin/AdminCourses";
import AdminCourseDetail from "./components/admin/AdminCourseDetail";
import AdminTeacherDetail from "./components/admin/AdminTeacherDetail";
import AdminApprovals from "./components/admin/AdminApprovals";
import AdminDeletedMembers from "./components/admin/AdminDeletedMembers";
import AdminSidebar from "./components/admin/AdminSidebar";
//superadmin routes
import SuperAdminDashboard from "./components/superadmin/SuperAdminDashboard";
//common components (shared across all roles)
import Profile from "./components/common/Profile";
import Settings from "./components/common/Settings";
import TeacherCourses from "./components/teacher/TeacherCourses";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import StudentsEnrolled from "./components/teacher/StudentsEnrolled";
import { trackRouteTransition } from "./services/telemetry";

function App() {
  return <Main />;
}

function Main() {
  const location = useLocation();
  const hideShell = location.pathname === "/login";
  const navigationStartRef = useRef(performance.now());

  useEffect(() => {
    const now = performance.now();
    const durationMs = Math.max(now - navigationStartRef.current, 0);

    trackRouteTransition({
      route: location.pathname,
      durationMs,
    });

    navigationStartRef.current = now;
  }, [location.pathname]);

  return (
    <>
      {!hideShell &&
        !(location.pathname === "/teacher/courses/add") &&
        !location.pathname.startsWith("/admin") &&
        !location.pathname.startsWith("/teacher/sidebar") &&
        !location.pathname.startsWith("/student/sidebar") && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Teacher routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRole={["Teacher"]}>
              <Teacher />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<TeacherHome />} />
          <Route path="courses" element={<TeacherAllCourses />} />
          <Route path="courses/:courseId" element={<TeacherCourseDetail />} />
          <Route
            path="courses/:courseId/edit"
            element={<TeacherEditCourse />}
          />
          <Route
            path="courses/:courseId/:chapterId/:topicId/quiz"
            element={<StudentQuiz />}
          />
          <Route path="courses/add" element={<TeacherAddCourse />} />
          <Route path="flashcards" element={<TeacherFlashcards />} />
          <Route path="chapters" element={<TeacherChapters />} />
          <Route
            path="upload-qualification"
            element={<TeacherQualificationUpload />}
          />
          <Route path="assignments" element={<TeacherAssignments />} />
          <Route path="assignments/create" element={<CreateAssignment />} />
          <Route
            path="assignments/:assignmentId/submissions"
            element={<AssignmentSubmissions />}
          />
        </Route>

        {/* Teacher Sidebar Dashboard (same layout as admin) */}
        <Route path="/teacher/sidebar" element={<AdminSidebar />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="users" element={<StudentsEnrolled />} />
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Student routes  */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole={["Student"]}>
              <Student />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<StudentHome />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId" element={<StudentCourseDetail />} />
          <Route
            path="courses/:courseId/:chapterId/:topicId/quiz"
            element={<StudentQuiz />}
          />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route
            path="assignments/:assignmentId/submit"
            element={<SubmitAssignment />}
          />
          <Route
            path="assignments/:assignmentId/view"
            element={<ViewSubmission />}
          />
        </Route>

        {/* Student Sidebar Dashboard (same layout as admin) */}
        <Route path="/student/sidebar" element={<AdminSidebar />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route
            path="courses/:courseId/flashcards"
            element={<StudentFlashcards />}
          />
          <Route path="deck/:deckId" element={<StudentStudyDeck />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route
            path="assignments/:assignmentId/submit"
            element={<SubmitAssignment />}
          />
          <Route
            path="assignments/:assignmentId/view"
            element={<ViewSubmission />}
          />
          <Route path="streak" element={<Streak />} />
          <Route path="quizzes" element={<StudentQuizHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Admin routes  - protect admin pages */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole={["Admin"]}>
              <AdminSidebar />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="deleted-members" element={<AdminDeletedMembers />} />
          <Route path="teachers/:teacherId" element={<AdminTeacherDetail />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="courses/:courseId" element={<AdminCourseDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* SuperAdmin routes - protect superadmin pages */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRole={["SuperAdmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!hideShell &&
        !(location.pathname === "/teacher/courses/add") &&
        !(location.pathname === "/teacher/upload-qualification") &&
        !location.pathname.startsWith("/admin") &&
        !location.pathname.startsWith("/teacher/sidebar") &&
        !location.pathname.startsWith("/student/sidebar") && <Footer />}
    </>
  );
}

export default App;
