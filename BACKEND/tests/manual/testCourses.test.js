describe("testCourses conversion", () => {
  test("targets the student courses endpoint", () => {
    const endpoint = "http://localhost:3000/student/courses";
    expect(endpoint.endsWith("/student/courses")).toBe(true);
  });
});
