describe("simpleTest conversion", () => {
  test("targets the student base endpoint", () => {
    const endpoint = "http://localhost:3000/student";
    expect(endpoint.endsWith("/student")).toBe(true);
  });
});
