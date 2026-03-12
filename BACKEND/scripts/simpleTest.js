(async () => {
  try {
    const response = await fetch("http://localhost:3000/student");
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response:", text);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
