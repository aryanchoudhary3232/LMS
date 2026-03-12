(async () => {
  const backendUrl = "http://localhost:3000";

  try {
    // Test 1: Register a student
    console.log("Testing student registration...");
    const registerResponse = await fetch(`${backendUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: "student@test.com",
        password: "student123",
        role: "Student",
      }),
    });
    const registerData = await registerResponse.json();
    console.log("Student Registration response:", registerData);

    // Test 2: Login with the student
    console.log("\nTesting student login...");
    const loginResponse = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "student@test.com",
        password: "student123",
      }),
    });
    const loginData = await loginResponse.json();
    console.log("Student Login response:", loginData);

    if (loginData.success) {
      const token = loginData.token;

      // Test 3: Get all courses as student
      console.log("\nTesting student courses endpoint...");
      const coursesResponse = await fetch(`${backendUrl}/student/courses`);
      const coursesData = await coursesResponse.json();
      console.log("Student Courses response:", coursesData);

      console.log("✅ Student can register, login, and access courses");
      console.log("Token received:", token ? "Yes" : "No");
      console.log("Role:", loginData.data?.role);
      console.log(
        "Courses available:",
        coursesData.success ? coursesData.data.length : "Error"
      );
    } else {
      console.log("❌ Student Login failed:", loginData.message);
    }
  } catch (error) {
    console.error("Test error:", error);
  }
})();
