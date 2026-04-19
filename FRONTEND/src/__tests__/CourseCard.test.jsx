import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CourseCard from "../pages/CourseCard";

const MOCK_COURSE = {
  _id: "abc123",
  title: "React Basics",
  price: 999,
  category: "Development",
  rating: { average: 4.5, count: 120 },
};

describe("CourseCard", () => {
  // Test 9
  it("renders course title, price, and category from props", () => {
    render(
      <MemoryRouter>
        <CourseCard course={MOCK_COURSE} onAddToCart={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.getByText("React Basics")).toBeInTheDocument();
    expect(screen.getByText("₹999")).toBeInTheDocument();
    expect(screen.getByText("Development")).toBeInTheDocument();
  });
});
