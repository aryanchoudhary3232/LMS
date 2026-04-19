import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../helper/ProtectedRoute";

// Builds a structurally valid JWT with the given payload.
// The signature is fake — ProtectedRoute only decodes the payload, never verifies.
function makeFakeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

function renderProtectedRoute(token, allowedRole) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }

  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRole={allowedRole}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/student/home" element={<div>Student Home</div>} />
        <Route path="/teacher/home" element={<div>Teacher Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  afterEach(() => {
    localStorage.clear();
  });

  // Test 6
  it("redirects to /login when no token is present in localStorage", () => {
    renderProtectedRoute(null, ["Student"]);

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  // Test 7
  it("renders children when the token role matches the allowedRole", () => {
    const token = makeFakeJwt({ role: "Student", id: "user-1" });
    renderProtectedRoute(token, ["Student"]);

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  // Test 8
  it("redirects a Teacher to /teacher/home when visiting a Student-only route", () => {
    const token = makeFakeJwt({ role: "Teacher", id: "user-2" });
    renderProtectedRoute(token, ["Student"]);

    expect(screen.getByText("Teacher Home")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});
