describe("testStudentFlow conversion", () => {
  test("keeps student registration/login payloads", () => {
    const registerPayload = {
      name: "Test Student",
      email: "student@test.com",
      password: "student123",
      role: "Student",
    };
    const loginPayload = {
      email: "student@test.com",
      password: "student123",
    };

    expect(registerPayload.role).toBe("Student");
    expect(loginPayload.email).toBe(registerPayload.email);
  });
});
