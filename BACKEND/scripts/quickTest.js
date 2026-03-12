(async () => {
  const backendUrl = "http://localhost:3000";

  try {
    // Test 1: Basic API health check
    console.log("Testing basic API health...");
    const healthResponse = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test", password: "test" }),
    });
    console.log("Auth endpoint status:", healthResponse.status);

    // Test 2: Student courses endpoint
    console.log("\nTesting student courses endpoint...");
    const coursesResponse = await fetch(`${backendUrl}/student/courses`);
    console.log("Student courses status:", coursesResponse.status);

    if (coursesResponse.status === 200) {
      const text = await coursesResponse.text();
      try {
        const data = JSON.parse(text);
        console.log("✅ Student courses endpoint working:", data);
      } catch (e) {
        console.log("❌ Response not JSON:", text.substring(0, 100));
      }
    } else {
      const text = await coursesResponse.text();
      console.log("❌ Student courses error:", text.substring(0, 100));
    }

    // Test 3: Teacher courses (for comparison)
    console.log("\nTesting teacher courses endpoint...");
    const teacherCoursesResponse = await fetch(
      `${backendUrl}/teacher/courses/get_courses`
    );
    console.log("Teacher courses status:", teacherCoursesResponse.status);
  } catch (error) {
    console.error("Connection error:", error.message);
  }
})();
