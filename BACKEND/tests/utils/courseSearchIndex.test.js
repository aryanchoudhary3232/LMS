const {
  normalizeCourseDocument,
  escapeForPhrasePrefix,
} = require("../../utils/courseSearchIndex");

describe("normalizeCourseDocument", () => {
  test("maps all fields from a full course object", () => {
    const teacher = { toString: () => "teacher123" };
    const now = new Date();

    const result = normalizeCourseDocument({
      _id: "abc",
      title: "JavaScript Basics",
      description: "Learn JS",
      category: "Development",
      level: "beginner",
      teacher,
      price: 499,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    expect(result).toEqual({
      title: "JavaScript Basics",
      description: "Learn JS",
      category: "Development",
      level: "beginner",
      teacherId: "teacher123",
      price: 499,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
  });

  test("coerces missing fields to safe defaults", () => {
    const result = normalizeCourseDocument({});

    expect(result.title).toBe("");
    expect(result.description).toBe("");
    expect(result.category).toBe("");
    expect(result.level).toBe("");
    expect(result.teacherId).toBe("");
    expect(result.price).toBe(0);
    expect(result.isDeleted).toBe(false);
  });

  test("returns null for falsy input", () => {
    expect(normalizeCourseDocument(null)).toBeNull();
    expect(normalizeCourseDocument(undefined)).toBeNull();
  });

  test("casts price string to number", () => {
    const result = normalizeCourseDocument({ price: "299" });
    expect(result.price).toBe(299);
  });
});

describe("escapeForPhrasePrefix", () => {
  test("strips Elasticsearch special characters", () => {
    expect(escapeForPhrasePrefix("hello+world")).toBe("hello world");
    expect(escapeForPhrasePrefix("foo/bar")).toBe("foo bar");
    expect(escapeForPhrasePrefix("(test)")).toBe(" test ");
  });

  test("leaves plain text unchanged", () => {
    expect(escapeForPhrasePrefix("javascript basics")).toBe("javascript basics");
  });

  test("returns empty string for falsy input", () => {
    expect(escapeForPhrasePrefix(null)).toBe("");
    expect(escapeForPhrasePrefix(undefined)).toBe("");
    expect(escapeForPhrasePrefix("")).toBe("");
  });
});
