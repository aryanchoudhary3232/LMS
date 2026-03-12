import React, { useEffect, useState } from "react";
import "../../css/teacher/Courses.css";
import { Link } from "react-router-dom";
import CourseCard from "../../pages/CourseCard";
import {FaSearch, FaChevronDown} from "react-icons/fa";

const getToken = () => {
  // Try to get token from localStorage (assume login stores it as 'token')
  return localStorage.getItem("token") || "";
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [searchParams, setSearchParams] = useState({
  query: '',
  category: '',
  level: ''
});
const [loading, setLoading] = useState(false);

const handleSearch = async (e) => {
  const { name, value } = e.target;
  setSearchParams(prev => ({
    ...prev,
    [name]: value
  }));

  try {
    setLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const queryString = new URLSearchParams({
      ...searchParams,
      [name]: value
    }).toString();

    const response = await fetch(`${backendUrl}/courses/search?${queryString}`);
    const data = await response.json();

    if (data.success) {
      setCourses(data.data);
    } else {
      console.error("Error searching courses:", data.message);
    }
  } catch (error) {
    console.error("Search error:", error);
  } finally {
    setLoading(false);
  }
};

  const getAllCourses = async () => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/courses`);
      const coursesResponse = await response.json();

      if (coursesResponse.success) {
        setCourses(coursesResponse.data);
      } else {
        console.error("Error fetching courses:", coursesResponse.message);
      }
    } catch (error) {
      console.log("error occurred", error);
    }
  };

  const handleAddToCart = async (courseId) => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const token = getToken();
      const res = await fetch(`${backendUrl}/cart/add/${courseId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Added to cart!");
        // Dispatch event to update navbar
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        alert(data.message || "Failed to add to cart");
      }
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

  useEffect(() => {
    getAllCourses();
  }, []);


  

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h1>Courses</h1>
      </div>


       <div className="courses-filter-bar">
  <div className="filter-search">
    <FaSearch className="filter-icon" />
    <input 
      type="text" 
      name="query"
      placeholder="Search in your courses..." 
      value={searchParams.query}
      onChange={handleSearch}
    />
  </div>
  <div className="filter-dropdown">
    <select 
      name="category" 
      value={searchParams.category}
      onChange={handleSearch}
    >
      <option value="">All Category</option>
      <option value="Programming">Programming</option>
      <option value="Design">Design</option>
      <option value="Business">Business</option>
      <option value="Marketing">Marketing</option>
      {/* Add more categories based on your data */}
    </select>
    <FaChevronDown className="filter-icon-small" />
  </div>
  <div className="filter-dropdown">
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
    <FaChevronDown className="filter-icon-small" />
  </div>
</div>

      

      {/* --- Courses Grid --- */}
      <div className="courses-grid">
        {courses.length === 0 ? (
          <p className="no-courses">No courses available.</p>
        ) : (
          courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onAddToCart={() => handleAddToCart(course._id)}
              onFlashcardClick={handleFlashcardClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Courses;
