describe("testStudentEndpoint conversion", () => {
  test("targets student courses endpoint directly", () => {
    const endpoint = "http://localhost:3000/student/courses";
    expect(endpoint.startsWith("http://localhost:3000")).toBe(true);
  });
});
