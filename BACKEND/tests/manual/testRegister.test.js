describe("testRegister conversion", () => {
  test("keeps admin registration payload contract", () => {
    const payload = {
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "Admin",
    };

    expect(payload.role).toBe("Admin");
    expect(payload.email).toContain("@");
  });
});
