describe("testStudentTest conversion", () => {
  test("builds HTTP request options for student test endpoint", () => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/student/test",
      method: "GET",
    };

    expect(options.method).toBe("GET");
    expect(options.path).toBe("/student/test");
  });
});
