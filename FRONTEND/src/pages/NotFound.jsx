import React from "react";
import { Link } from "react-router-dom";
import "../css/Home.css";

const NotFound = () => {
  return (
    <div className="notfound container" style={{ padding: 40, textAlign: "center" }}>
      <h1 style={{ fontSize: 48 }}>404</h1>
      <h3>Page not found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <p>
        Go back to <Link to="/">home</Link> or visit our <Link to="/courses">courses</Link>.
      </p>
    </div>
  );
};

export default NotFound;
