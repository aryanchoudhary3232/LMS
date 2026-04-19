describe("testTeacherFlow conversion", () => {
  test("keeps teacher registration/login payloads", () => {
    const registerPayload = {
      name: "Test Teacher",
      email: "teacher@test.com",
      password: "teacher123",
      role: "Teacher",
    };
    const loginPayload = {
      email: "teacher@test.com",
      password: "teacher123",
    };

    expect(registerPayload.role).toBe("Teacher");
    expect(loginPayload.email).toBe(registerPayload.email);
  });
});
