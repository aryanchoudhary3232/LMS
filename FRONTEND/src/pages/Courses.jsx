import React, { useEffect, useState, useCallback, useRef } from "react";
import "../css/teacher/Courses.css";
import CourseCard from "./CourseCard";
import { FaSearch, FaChevronDown } from "react-icons/fa";

const getToken = () => localStorage.getItem("token") || "";

const COURSE_FIELDS = `
  _id
  title
  description
  image
  category
  level
  price
  rating
  ratingCount
  studentCount
`;

const COURSES_QUERY = `
  query Courses($query: String, $category: String, $level: String) {
    courses(query: $query, category: $category, level: $level) {
      ${COURSE_FIELDS}
    }
  }
`;

const ENROLLED_COURSES_QUERY = `
  query EnrolledCourses {
    enrolledCourses {
      _id
      course {
        _id
      }
    }
  }
`;

const ENROLLED_COURSES_ME_QUERY = `
  query EnrolledCoursesFromMe {
    me {
      enrolledCourses {
        _id
        course {
          _id
        }
      }
    }
  }
`;

const ADD_TO_CART_MUTATION = `
  mutation AddToCart($courseId: ID!) {
    addToCart(courseId: $courseId) {
      success
      message
    }
  }
`;

const extractFirstArray = (payload) => {
  if (!payload || typeof payload !== "object") return [];
  const candidate = Object.values(payload).find((value) => Array.isArray(value));
  return Array.isArray(candidate) ? candidate : [];
};

const extractCoursesFromGraphQL = (payload) => {
  if (!payload || typeof payload !== "object") return [];

  const knownKeys = [
    "courses",
    "searchCourses",
    "allCourses",
    "getCourses",
    "courseList",
    "listCourses",
  ];

  for (const key of knownKeys) {
    if (Array.isArray(payload[key])) return payload[key];
    if (payload[key] && Array.isArray(payload[key].data)) return payload[key].data;
  }

  return extractFirstArray(payload);
};

const extractOwnedIdsFromGraphQL = (payload) => {
  const rootList = Array.isArray(payload?.enrolledCourses)
    ? payload.enrolledCourses
    : Array.isArray(payload?.me?.enrolledCourses)
    ? payload.me.enrolledCourses
    : extractFirstArray(payload);

  return rootList
    .map((item) => item?.course?._id || item?._id)
    .filter(Boolean);
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [defaultCourses, setDefaultCourses] = useState([]);
  const [searchParams, setSearchParams] = useState({
    query: "",
    category: "",
    level: "",
  });

  const [loading, setLoading] = useState(true);
  const [isGraphQLAvailable, setIsGraphQLAvailable] = useState(true);
  
  const searchTimeout = useRef(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

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

  const requestGraphQL = useCallback(
    async (query, variables = {}, token = "") => {
      const response = await fetch(`${backendUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed with status ${response.status}`);
      }

      const payload = await response.json();
      if (payload?.errors?.length) {
        throw new Error(payload.errors[0].message || "GraphQL query failed");
      }

      return payload?.data || {};
    },
    [backendUrl],
  );

  const fetchCoursesViaRest = useCallback(
    async (params) => {
      const hasFilters = !!(params.query || params.category || params.level);
      const queryString = new URLSearchParams(params).toString();
      const endpoint = hasFilters
        ? `${backendUrl}/courses/search?${queryString}`
        : `${backendUrl}/courses`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      return [];
    },
    [backendUrl],
  );

  const fetchCoursesData = useCallback(
    async (params) => {
      if (isGraphQLAvailable) {
        try {
          const graphData = await requestGraphQL(COURSES_QUERY, {
            query: params.query || null,
            category: params.category || null,
            level: params.level || null,
          });

          return extractCoursesFromGraphQL(graphData);
        } catch (error) {
          // If GraphQL endpoint/schema is unavailable, continue with REST.
          console.warn("GraphQL unavailable for courses page, using REST fallback:", error.message);
          setIsGraphQLAvailable(false);
        }
      }

      return fetchCoursesViaRest(params);
    },
    [isGraphQLAvailable, requestGraphQL, fetchCoursesViaRest],
  );

  useEffect(() => {
    let isMounted = true;

    const loadInitialCourses = async () => {
      setLoading(true);
      try {
        const initialCourses = await fetchCoursesData({ query: "", category: "", level: "" });
        if (isMounted) {
          setDefaultCourses(initialCourses);
        }
      } catch (error) {
        if (isMounted) {
          setDefaultCourses([]);
        }
        console.error("Failed to load courses:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialCourses();

    return () => {
      isMounted = false;
    };
  }, [fetchCoursesData]);

  // Helper: check if user is filtering
  const isSearchActive = searchParams.query || searchParams.category || searchParams.level;

  const handleSearch = (e) => {
    const { name, value } = e.target;

    const nextParams = { ...searchParams, [name]: value };
    setSearchParams(nextParams);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    setLoading(true);

    searchTimeout.current = setTimeout(async () => {
      if (!nextParams.query && !nextParams.category && !nextParams.level) {
        setLoading(false);
        setCourses([]);
        return;
      }

      try {
        const searchedCourses = await fetchCoursesData(nextParams);
        setCourses(searchedCourses);
      } catch (error) {
        setCourses([]);
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleSearchButton = async () => {
    if (!searchParams.query && !searchParams.category && !searchParams.level) {
      setCourses([]);
      return;
    }

    setLoading(true);
    try {
      const searchedCourses = await fetchCoursesData(searchParams);
      setCourses(searchedCourses);
    } catch (searchError) {
      setCourses([]);
      console.error("Manual search error:", searchError);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnedCourses = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      let ownedIds = [];

      if (isGraphQLAvailable) {
        try {
          const graphData = await requestGraphQL(ENROLLED_COURSES_QUERY, {}, token);
          ownedIds = extractOwnedIdsFromGraphQL(graphData);

          if (ownedIds.length === 0) {
            const graphDataFromMe = await requestGraphQL(ENROLLED_COURSES_ME_QUERY, {}, token);
            ownedIds = extractOwnedIdsFromGraphQL(graphDataFromMe);
          }
        } catch (error) {
          console.warn("GraphQL unavailable for enrolled courses, using REST fallback:", error.message);
          setIsGraphQLAvailable(false);
        }
      }

      if (ownedIds.length === 0) {
        const response = await fetch(`${backendUrl}/student/enrolled-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.data)) {
          ownedIds = data.data.map((course) => course._id);
        }
      }

      setOwnedCourseIds(new Set(ownedIds));
      localStorage.setItem("enrolledCourseIds", JSON.stringify(ownedIds));
    } catch (error) {
      console.error("Error fetching enrolled courses", error);
    }
  }, [backendUrl, isGraphQLAvailable, requestGraphQL]);

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
      if (isGraphQLAvailable) {
        try {
          const graphData = await requestGraphQL(
            ADD_TO_CART_MUTATION,
            { courseId },
            token,
          );

          const result =
            graphData?.addToCart ||
            graphData?.addCourseToCart ||
            graphData?.cartAdd ||
            null;

          const isSuccess =
            typeof result?.success === "boolean" ? result.success : Boolean(result ?? true);
          const message = result?.message || (isSuccess ? "Added to cart!" : "Failed to add to cart");

          if (isSuccess) {
            alert(message);
            window.dispatchEvent(new Event("cartUpdated"));
            return;
          }

          alert(message);
          return;
        } catch (error) {
          console.warn("GraphQL unavailable for add-to-cart, using REST fallback:", error.message);
          setIsGraphQLAvailable(false);
        }
      }

      const response = await fetch(`${backendUrl}/cart/add/${courseId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        alert("Added to cart!");
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        alert(data.message || "Failed to add to cart");
      }
    } catch (cartError) {
      console.error("Error adding to cart:", cartError);
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-state">
           <div className="spinner"></div>
           <p>Finding best courses...</p>
        </div>
      );
    }

    const listToRender = isSearchActive ? courses : defaultCourses;
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
