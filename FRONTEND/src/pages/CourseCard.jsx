import React from "react";
import { Link } from "react-router-dom";
import { FaStar, FaUserFriends, FaShoppingCart, FaPlay, FaBookmark } from "react-icons/fa";

const CourseCard = ({ course, onAddToCart, isOwned = false, isAuthenticated = false, onFlashcardClick }) => {
  const ratingAverage = course && typeof course.rating === "object" ? course.rating.average : course.rating || 4.5;
  const ratingCount = course && typeof course.rating === "object" ? course.rating.count : (course.ratingCount || 0);
  const studentCount = course.studentCount || "435,671";
  const svgPlaceholder =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='250' height='150'><rect fill='%23e6e6e6' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='18'>No Image</text></svg>";

  return (
    <div className="course-card">
      <Link to={`/courses/${course._id}`} className="course-card-image-wrapper">
        <img
          src={course.image || svgPlaceholder}
          alt={course.title}
          className="course-card-image"
          onError={(e) => {
            if (e && e.target) e.target.src = svgPlaceholder;
          }}
        />
        <div className="course-card-overlay"></div>
      </Link>

      <div className="course-card-content">
        {/* Header: Category & Rating */}
        <div className="card-header">
          <span className="course-category">
            {course.category || "Development"}
          </span>
          <div className="course-rating">
            <FaStar className="star-icon" />
            <span>{ratingAverage}</span>
            {ratingCount ? (
              <small>({ratingCount})</small>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <Link
          style={{ textDecoration: "none" }}
          to={`/courses/${course._id}`}
          className="course-title-link"
        >
          <h3 className="course-title">{course.title}</h3>
        </Link>

        {/* Student Count */}
        <div className="course-meta">
          <FaUserFriends className="meta-icon" />
          <span>{studentCount} students</span>
        </div>

        {/* Price & Actions Section */}
        <div className="course-footer">
          <span className="course-price">₹{course.price}</span>
          
          {isOwned && isAuthenticated ? (
            <Link
              className="btn-primary"
              to={`/student/courses/${course._id}`}
            >
              <FaPlay /> Go to Course
            </Link>
          ) : (
            <button 
              className="btn-primary" 
              onClick={onAddToCart}
              title="Add to Cart"
            >
              <FaShoppingCart /> Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;