(async () => {
  const backendUrl = "http://localhost:3000";

  try {
    console.log("Testing student courses endpoint directly...");
    const response = await fetch(`${backendUrl}/student/courses`);
    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const text = await response.text();
    console.log("Raw response:", text.substring(0, 200));

    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      console.log("Parsed JSON:", data);
    } catch (e) {
      console.log("Not valid JSON, first 200 chars:", text.substring(0, 200));
    }
  } catch (error) {
    console.error("Test error:", error);
  }
})();
