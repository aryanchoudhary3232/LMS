/**
 * Middleware Test Script
 * Tests: paramSanitizer, inputValidator, fileUploadValidator
 *
 * Run:  node scripts/testMiddlewares.js
 */

const http = require("http");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3000";
const SECRET = "aryan123";

// Generate test tokens
const studentToken = jwt.sign(
  { _id: "507f1f77bcf86cd799439011", role: "Student", name: "Test Student" },
  SECRET,
  { expiresIn: "1h" },
);

const teacherToken = jwt.sign(
  { _id: "507f1f77bcf86cd799439022", role: "Teacher", name: "Test Teacher" },
  SECRET,
  { expiresIn: "1h" },
);

// ─── HTTP helper ───
function request(method, urlPath, { body, token, contentType } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const isJson = !contentType || contentType === "application/json";
    const payload = body && isJson ? JSON.stringify(body) : body;

    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {},
    };

    if (token) opts.headers["Authorization"] = `Bearer ${token}`;
    if (payload && isJson) {
      opts.headers["Content-Type"] = "application/json";
      opts.headers["Content-Length"] = Buffer.byteLength(payload);
    }
    if (contentType && contentType !== "application/json") {
      opts.headers["Content-Type"] = contentType;
      if (payload) opts.headers["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Multipart helper for file upload tests
function multipartRequest(method, urlPath, fields, files, token) {
  return new Promise((resolve, reject) => {
    const boundary = "----TestBoundary" + Date.now();
    const url = new URL(urlPath, BASE);

    let bodyParts = [];

    // Add text fields
    for (const [key, val] of Object.entries(fields)) {
      bodyParts.push(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`,
      );
    }

    // Add file fields
    for (const file of files) {
      bodyParts.push(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\nContent-Type: ${file.mimetype}\r\n\r\n`,
      );
      bodyParts.push(file.content);
      bodyParts.push("\r\n");
    }

    bodyParts.push(`--${boundary}--\r\n`);

    const bodyBuffers = bodyParts.map((p) =>
      Buffer.isBuffer(p) ? p : Buffer.from(p),
    );
    const bodyBuffer = Buffer.concat(bodyBuffers);

    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": bodyBuffer.length,
      },
    };

    if (token) opts.headers["Authorization"] = `Bearer ${token}`;

    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    req.write(bodyBuffer);
    req.end();
  });
}

// ─── Pretty printer ───
let passed = 0;
let failed = 0;

function logTest(name, expected, actual, response) {
  const ok = actual === expected;
  const icon = ok ? "✅" : "❌";
  if (ok) passed++;
  else failed++;

  console.log(`${icon} ${name}`);
  console.log(`   Expected: ${expected} | Got: ${actual}`);
  if (response.body?.message)
    console.log(`   Message: "${response.body.message}"`);
  if (response.body?.errors)
    console.log(`   Errors:  ${JSON.stringify(response.body.errors)}`);
  console.log();
}

// ═══════════════════════════════════════════════
async function runTests() {
  console.log("═══════════════════════════════════════════════");
  console.log("  MIDDLEWARE TEST SUITE");
  console.log("═══════════════════════════════════════════════\n");

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. PARAM SANITIZER TESTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log("━━━ 1. PARAM SANITIZER ━━━\n");

  // 1a. Invalid courseId on public student route
  const t1a = await request("GET", "/student/courses/NOT-A-VALID-ID");
  logTest(
    "GET /student/courses/NOT-A-VALID-ID → 400 (invalid ObjectId)",
    400,
    t1a.status,
    t1a,
  );

  // 1b. Valid-format ObjectId (should pass sanitizer → 404 if course not found)
  const t1b = await request("GET", "/student/courses/507f1f77bcf86cd799439011");
  logTest(
    "GET /student/courses/507f1f77bcf86cd799439011 → not 400 (valid ObjectId passes)",
    true,
    t1b.status !== 400,
    t1b,
  );

  // 1c. Invalid courseId on teacher route
  const t1c = await request("GET", "/teacher/courses/get_course_by_id/abc123");
  logTest(
    "GET /teacher/courses/get_course_by_id/abc123 → 400 (invalid ObjectId)",
    400,
    t1c.status,
    t1c,
  );

  // 1d. SQL-injection-style param
  const t1d = await request("GET", "/student/courses/'; DROP TABLE courses;--");
  logTest(
    "GET /student/courses/'; DROP TABLE courses;-- → 400 (blocked)",
    400,
    t1d.status,
    t1d,
  );

  // 1e. Valid ObjectId on teacher route (should pass sanitizer)
  const t1e = await request(
    "GET",
    "/teacher/courses/get_course_by_id/507f1f77bcf86cd799439011",
  );
  logTest(
    "GET /teacher/courses/get_course_by_id/<validId> → not 400 (passes sanitizer)",
    true,
    t1e.status !== 400,
    t1e,
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. INPUT VALIDATOR TESTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log("━━━ 2. INPUT VALIDATOR ━━━\n");

  // 2a. Student: POST /quiz_submit with empty body → 400
  const t2a = await request("POST", "/student/quiz_submit", {
    token: studentToken,
    body: {},
  });
  logTest(
    "POST /student/quiz_submit (empty body) → 400 (validation fails)",
    400,
    t2a.status,
    t2a,
  );

  // 2b. Student: POST /quiz_submit with missing fields
  const t2b = await request("POST", "/student/quiz_submit", {
    token: studentToken,
    body: { courseId: "507f1f77bcf86cd799439011" },
  });
  logTest(
    "POST /student/quiz_submit (only courseId) → 400 (missing chapterId, topicId, answerQuiz)",
    400,
    t2b.status,
    t2b,
  );

  // 2c. Student: POST /quiz_submit with invalid ObjectId format in body
  const t2c = await request("POST", "/student/quiz_submit", {
    token: studentToken,
    body: {
      courseId: "INVALID",
      chapterId: "INVALID",
      topicId: "INVALID",
      answerQuiz: [{ question: "Q1", tickOption: "A" }],
    },
  });
  logTest(
    "POST /student/quiz_submit (invalid ObjectIds in body) → 400",
    400,
    t2c.status,
    t2c,
  );

  // 2d. Student: POST /progress with invalid minutes
  const t2d = await request("POST", "/student/progress", {
    token: studentToken,
    body: { minutes: -5 },
  });
  logTest(
    "POST /student/progress (minutes: -5) → 400 (min is 1)",
    400,
    t2d.status,
    t2d,
  );

  // 2e. Student: POST /progress with minutes > 1440
  const t2e = await request("POST", "/student/progress", {
    token: studentToken,
    body: { minutes: 9999 },
  });
  logTest(
    "POST /student/progress (minutes: 9999) → 400 (max is 1440)",
    400,
    t2e.status,
    t2e,
  );

  // 2f. Student: POST /mark-topic-complete with empty body
  const t2f = await request("POST", "/student/mark-topic-complete", {
    token: studentToken,
    body: {},
  });
  logTest(
    "POST /student/mark-topic-complete (empty body) → 400",
    400,
    t2f.status,
    t2f,
  );

  // 2g. Student: PUT /update-enrollCourses with empty array
  const t2g = await request("PUT", "/student/update-enrollCourses", {
    token: studentToken,
    body: { courseIds: [] },
  });
  logTest(
    "PUT /student/update-enrollCourses (empty courseIds[]) → 400 (minItems: 1)",
    400,
    t2g.status,
    t2g,
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. FILE UPLOAD VALIDATOR TESTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log("━━━ 3. FILE UPLOAD VALIDATOR ━━━\n");

  // 3a. Teacher: POST /verification/upload with a .txt file (disallowed mime)
  const t3a = await multipartRequest(
    "POST",
    "/teacher/verification/upload",
    {},
    [
      {
        fieldname: "qualification",
        filename: "test.txt",
        mimetype: "text/plain",
        content: Buffer.from("this is a text file"),
      },
    ],
    teacherToken,
  );
  logTest(
    "POST /teacher/verification/upload (.txt file) → 400 (mime rejected by multerFileFilter)",
    400,
    t3a.status,
    t3a,
  );

  // 3b. Teacher: POST /courses/create_course with no files at all
  const chapters = JSON.stringify([
    { title: "Chapter 1", topics: [{ title: "Topic 1", quiz: [] }] },
  ]);

  const t3b = await multipartRequest(
    "POST",
    "/teacher/courses/create_course",
    {
      title: "Test Course",
      description: "A test course with enough description for validation",
      category: "Programming",
      level: "Beginner",
      duration: "10 hours",
      price: "99",
      chapters: chapters,
    },
    [], // no files
    teacherToken,
  );
  logTest(
    "POST /teacher/courses/create_course (no files) → 400 (missing required image & video)",
    400,
    t3b.status,
    t3b,
  );

  // 3c. Teacher: POST /verification/upload with a valid-mime file (should pass file validator)
  const t3c = await multipartRequest(
    "POST",
    "/teacher/verification/upload",
    {},
    [
      {
        fieldname: "qualification",
        filename: "cert.pdf",
        mimetype: "application/pdf",
        content: Buffer.from("%PDF-1.4 fake pdf content for test"),
      },
    ],
    teacherToken,
  );
  logTest(
    "POST /teacher/verification/upload (.pdf file) → not 400 (passes file validator)",
    true,
    t3c.status !== 400,
    t3c,
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log("═══════════════════════════════════════════════");
  console.log(
    `  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`,
  );
  console.log("═══════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
