async function testStudentCourses() {
  try {
    console.log("Testing student courses endpoint...");
    const response = await fetch("http://localhost:3000/student/courses");

    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log("Response Data:", JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log("Error Response:", errorText);
    }
  } catch (error) {
    console.error("Error testing endpoint:", error.message);
  }
}

testStudentCourses();
