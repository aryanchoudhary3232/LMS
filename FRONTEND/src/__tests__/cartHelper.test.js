import { describe, it, expect, beforeEach } from "vitest";
import {
  addToCart,
  removeFromCart,
  getCartItems,
  getCartTotal,
} from "../helper/cartHelper";

const COURSE_A = {
  id: "course-1",
  title: "React Basics",
  price: 999,
  instructor: "John",
  thumbnail: "",
};

const COURSE_B = {
  id: "course-2",
  title: "Node.js Advanced",
  price: 1499,
  instructor: "Jane",
  thumbnail: "",
};

describe("cartHelper", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Test 1
  it("getCartTotal returns 0 for an empty cart", () => {
    expect(getCartTotal()).toBe(0);
  });

  // Test 2
  it("addToCart adds a new course to the cart and returns true", () => {
    const result = addToCart(COURSE_A);

    expect(result).toBe(true);
    expect(getCartItems()).toHaveLength(1);
    expect(getCartItems()[0].id).toBe("course-1");
    expect(getCartItems()[0].title).toBe("React Basics");
  });

  // Test 3
  it("addToCart returns false and does not add a duplicate course", () => {
    addToCart(COURSE_A);
    const result = addToCart(COURSE_A);

    expect(result).toBe(false);
    expect(getCartItems()).toHaveLength(1);
  });

  // Test 4
  it("removeFromCart removes the correct course, leaving others intact", () => {
    addToCart(COURSE_A);
    addToCart(COURSE_B);

    removeFromCart("course-1");

    const items = getCartItems();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("course-2");
  });

  // Test 5
  it("getCartTotal sums the prices of all items in the cart", () => {
    addToCart(COURSE_A); // 999
    addToCart(COURSE_B); // 1499

    expect(getCartTotal()).toBe(2498);
  });
});
