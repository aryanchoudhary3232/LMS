import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "../pages/NotFound";

describe("NotFound", () => {
  // Test 10
  it("renders 404 heading, description, and links to home and courses", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /home/i });
    const coursesLink = screen.getByRole("link", { name: /courses/i });

    expect(homeLink).toHaveAttribute("href", "/");
    expect(coursesLink).toHaveAttribute("href", "/courses");
  });
});
