// Quick file upload test for fileUploadValidator
const http = require("http");

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMjIiLCJyb2xlIjoiVGVhY2hlciIsIm5hbWUiOiJUZXN0IFRlYWNoZXIiLCJpYXQiOjE3NzA2NTY5ODcsImV4cCI6MTc3MDY2MDU4N30.Eut3zBXDlTkQwk5P4tXBTDXw0B97f_x2ATmLa1gg0cc";

function send(label, filePath, fieldname, filename, mimetype, content) {
  return new Promise((resolve) => {
    const boundary = "----TestBound" + Date.now();
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldname}"; filename="${filename}"\r\nContent-Type: ${mimetype}\r\n\r\n`,
      content,
      `\r\n--${boundary}--\r\n`,
    ];
    const body = Buffer.concat(
      parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p))),
    );

    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: filePath,
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
          Authorization: `Bearer ${TOKEN}`,
        },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          const icon = res.statusCode === 400 ? "✅" : "⚠️";
          console.log(`\n${icon} [${label}]  Status: ${res.statusCode}`);
          try {
            console.log("   Body:", JSON.stringify(JSON.parse(d), null, 2));
          } catch {
            console.log("   Body:", d);
          }
          resolve();
        });
      },
    );
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("━━━ FILE UPLOAD VALIDATOR TESTS ━━━\n");

  // Test 1: .txt file → multerFileFilter should reject
  await send(
    "Reject .txt file (disallowed mime)",
    "/teacher/verification/upload",
    "qualification",
    "resume.txt",
    "text/plain",
    Buffer.from("Hello this is a text file"),
  );

  // Test 2: .exe file → multerFileFilter should reject
  await send(
    "Reject .exe file (disallowed mime)",
    "/teacher/verification/upload",
    "qualification",
    "malware.exe",
    "application/x-msdownload",
    Buffer.from("MZ fake exe header"),
  );

  // Test 3: .pdf file → should PASS the filter
  await send(
    "Accept .pdf file (allowed mime)",
    "/teacher/verification/upload",
    "qualification",
    "certificate.pdf",
    "application/pdf",
    Buffer.from("%PDF-1.4 fake pdf content for testing"),
  );

  console.log("\n━━━ DONE ━━━");
}

run();
