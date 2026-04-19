module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  setupFiles: ["dotenv/config"],
  collectCoverageFrom: [
    "controller/adminController.js",
    "controller/teacherController.js",
    "controller/studentController.js",
    "controller/superadminController.js",
    "middleware/fileUploadValidator.js",
    "middleware/inputValidator.js",
    "middleware/paramSanitizer.js",
    "middleware/errorHandler.js",
    "utils/respond.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "cobertura"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "test-reports",
        outputName: "junit.xml",
      },
    ],
  ],
};
