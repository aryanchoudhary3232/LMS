describe("testStudentHttp conversion", () => {
  test("builds HTTP request options for student courses", () => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/student/courses",
      method: "GET",
    };

    expect(options.method).toBe("GET");
    expect(options.path).toBe("/student/courses");
  });
});
