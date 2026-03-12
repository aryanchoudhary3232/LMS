import React, { useEffect, useState, useCallback, useRef } from "react";
import "../css/teacher/Courses.css";
import CourseCard from "./CourseCard";
import { FaSearch, FaChevronDown } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../features/courses/coursesSlice";

const getToken = () => localStorage.getItem("token") || "";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [searchParams, setSearchParams] = useState({
    query: "",
    category: "",
    level: "",
  });
  
  // Local loading state for search operations
  const [loading, setLoading] = useState(false);
  
  const searchTimeout = useRef(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const dispatch = useDispatch();

  // Redux state for default list
  const coursesList = useSelector((state) => state.courses.list);

  // Whether the user is logged in
  const isAuthenticated = !!getToken();

  // Initialize owned courses
  const [ownedCourseIds, setOwnedCourseIds] = useState(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem("enrolledCourseIds") || "[]");
      return new Set(persisted);
    } catch (error) {
      console.error("Failed to parse enrolledCourseIds:", error);
      return new Set();
    }
  });

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // Helper: check if user is filtering
  const isSearchActive = searchParams.query || searchParams.category || searchParams.level;

  // --- CORE FIX: Handle Search with Immediate Loading ---
  const handleSearch = (e) => {
    const { name, value } = e.target;
    
    // 1. Update params immediately
    const nextParams = { ...searchParams, [name]: value };
    setSearchParams(nextParams);

    // 2. Clear existing timer
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // 3. SET LOADING IMMEDIATELY (Fixes the flash of "No courses found")
    setLoading(true);

    // 4. Debounce the fetch
    searchTimeout.current = setTimeout(async () => {
      // If all fields are empty, stop loading and return to default view
      if (!nextParams.query && !nextParams.category && !nextParams.level) {
        setLoading(false);
        setCourses([]);
        return;
      }

      try {
        const queryString = new URLSearchParams(nextParams).toString();
        const response = await fetch(`${backendUrl}/courses/search?${queryString}`);
        const data = await response.json();
        
        if (data.success) {
          setCourses(data.data);
        } else {
          setCourses([]);
        }
      } catch (error) {
        setCourses([]);
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500); // Increased slightly to 500ms for smoother feel while typing
  };

  // Manual search button
  const handleSearchButton = async () => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await fetch(`${backendUrl}/courses/search?${queryString}`);
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
      } else {
        setCourses([]);
      }
    } catch (error) {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnedCourses = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await fetch(`${backendUrl}/student/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.data)) {
        const ownedIds = data.data.map((course) => course._id);
        setOwnedCourseIds(new Set(ownedIds));
        localStorage.setItem("enrolledCourseIds", JSON.stringify(ownedIds));
      }
    } catch (error) {
      console.error("Error fetching enrolled courses", error);
    }
  }, [backendUrl]);

  useEffect(() => {
    loadOwnedCourses();
  }, [loadOwnedCourses]);

  const handleAddToCart = async (courseId) => {
    const token = getToken();
    if (!token) {
      alert("Please sign in to add courses to your cart");
      return;
    }
    if (ownedCourseIds.has(courseId)) {
      alert("You already own this course");
      return;
    }
    try {
      const res = await fetch(`${backendUrl}/cart/add/${courseId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Added to cart!");
        // Dispatch event to update navbar
        window.dispatchEvent(new Event("cartUpdated"));
      } else alert(data.message || "Failed to add to cart");
    } catch (err) {
      alert("Error adding to cart");
    }
  };

  const handleFlashcardClick = (courseId) => {
    const token = getToken();
    if (!token) {
      alert("Please sign in to view flashcards");
      return;
    }
    // Navigate to flashcards page for this course
    window.location.href = `/courses/${courseId}/flashcards`;
  };

  // --- Render Logic Helper ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-state">
           <div className="spinner"></div>
           <p>Finding best courses...</p>
        </div>
      );
    }

    // Determine which list to show
    const listToRender = isSearchActive ? courses : coursesList;
    const emptyMessage = isSearchActive ? "No matching courses found." : "No courses available.";

    if (listToRender.length === 0) {
      return <p className="no-courses">{emptyMessage}</p>;
    }

    return listToRender.map((course, index) => (
      <div 
        key={course._id} 
        className="fade-in-up" 
        style={{ animationDelay: `${index * 0.05}s` }} // Staggered animation
      >
        <CourseCard
          course={course}
          isOwned={isAuthenticated && ownedCourseIds.has(course._id)}
          isAuthenticated={isAuthenticated}
          onAddToCart={() => handleAddToCart(course._id)}
          onFlashcardClick={handleFlashcardClick}
        />
      </div>
    ));
  };

  return (
    <div className="courses-page-container">
      <div className="courses-header">
        <h1>Explore Courses</h1>
        <p className="header-subtitle">Expand your knowledge with our top-rated tutorials.</p>
      </div>

      <div className="courses-filter-bar">
        <div className="search-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            name="query"
            placeholder="Search python, design, etc..."
            value={searchParams.query}
            onChange={handleSearch}
            className="modern-search-input"
            autoComplete="off"
          />
        </div>

        <div className="filters-group">
          <div className="modern-dropdown">
            <select
              name="category"
              value={searchParams.category}
              onChange={handleSearch}
            >
              <option value="">All Categories</option>
              <option value="Programming">Programming</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Marketing">Marketing</option>
            </select>
            <FaChevronDown className="dropdown-icon" />
          </div>

          <div className="modern-dropdown">
            <select
              name="level"
              value={searchParams.level}
              onChange={handleSearch}
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advance">Advance</option>
            </select>
            <FaChevronDown className="dropdown-icon" />
          </div>
          
          <button className="modern-search-btn" onClick={handleSearchButton}>
            Search
          </button>
        </div>
      </div>

      <div className="courses-grid">
        {renderContent()}
      </div>
    </div>
  );
};

export default Courses;