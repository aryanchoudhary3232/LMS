describe("testFileUpload conversion", () => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
  ];
  const blockedMimeTypes = ["text/plain", "application/x-msdownload"];

  test("keeps expected allowed and blocked mime examples", () => {
    expect(allowedMimeTypes).toContain("application/pdf");
    expect(blockedMimeTypes).toContain("text/plain");
    expect(blockedMimeTypes).toContain("application/x-msdownload");
  });
});
