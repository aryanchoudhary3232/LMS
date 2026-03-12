const http = require("http");

function testStudentTestEndpoint() {
  console.log("Testing student test endpoint...");

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/student/test",
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
    });
  });

  req.on("error", (error) => {
    console.error("Request Error:", error.message);
  });

  req.end();
}

testStudentTestEndpoint();
