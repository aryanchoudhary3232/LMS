(async () => {
  const backendUrl = "http://localhost:3000";

  try {
    // Test 1: Register a teacher
    console.log("Testing teacher registration...");
    const registerResponse = await fetch(`${backendUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Teacher",
        email: "teacher@test.com",
        password: "teacher123",
        role: "Teacher",
      }),
    });
    const registerData = await registerResponse.json();
    console.log("Registration response:", registerData);

    // Test 2: Login with the teacher
    console.log("\nTesting teacher login...");
    const loginResponse = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "teacher@test.com",
        password: "teacher123",
      }),
    });
    const loginData = await loginResponse.json();
    console.log("Login response:", loginData);

    if (loginData.success) {
      console.log("✅ Teacher can register and login successfully");
      console.log("Token received:", loginData.token ? "Yes" : "No");
      console.log("Role:", loginData.data?.role);
    } else {
      console.log("❌ Login failed:", loginData.message);
    }
  } catch (error) {
    console.error("Test error:", error);
  }
})();
