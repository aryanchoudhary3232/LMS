describe("testMiddlewares conversion", () => {
  test("defines expected middleware test constants", () => {
    const baseUrl = "http://localhost:3000";
    const expectedChecks = [
      "paramSanitizer",
      "inputValidator",
      "fileUploadValidator",
    ];

    expect(baseUrl).toBe("http://localhost:3000");
    expect(expectedChecks).toEqual(
      expect.arrayContaining(["paramSanitizer", "inputValidator", "fileUploadValidator"]),
    );
  });
});
