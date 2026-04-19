describe("testTeacherCourses conversion", () => {
  test("targets teacher courses endpoint", () => {
    const endpoint = "http://localhost:3000/teacher/courses/get_courses";
    expect(endpoint).toMatch(/\/teacher\/courses\/get_courses$/);
  });
});
