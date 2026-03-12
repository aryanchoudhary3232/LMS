const http = require("http");

function testStudentEndpoint() {
  console.log("Testing student courses endpoint with http module...");

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/student/courses",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Response Data:", data);
      try {
        const jsonData = JSON.parse(data);
        console.log("Parsed JSON:", JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log("Response is not valid JSON");
      }
    });
  });

  req.on("error", (error) => {
    console.error("Request Error:", error.message);
  });

  req.end();
}

testStudentEndpoint();
