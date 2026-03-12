(async () => {
  try {
    console.log("Testing /student/courses...");
    const response = await fetch("http://localhost:3000/student/courses");
    console.log("Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    const text = await response.text();
    console.log("Response:", text.substring(0, 300));
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
