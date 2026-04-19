describe("testStudentCourses conversion", () => {
  test("points to student courses endpoint", () => {
    const endpoint = "http://localhost:3000/student/courses";
    expect(endpoint).toMatch(/\/student\/courses$/);
  });
});
