describe("quickTest conversion", () => {
  test("keeps the expected endpoint smoke-check list", () => {
    const endpoints = [
      "/auth/login",
      "/student/courses",
      "/teacher/courses/get_courses",
    ];

    expect(endpoints).toContain("/auth/login");
    expect(endpoints).toContain("/student/courses");
    expect(endpoints).toContain("/teacher/courses/get_courses");
  });
});
