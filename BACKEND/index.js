const express = require("express");
require("dotenv").config(); // Load environment variables FIRST
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const { errorHandler, notFound, performanceMonitor } = require("./middleware");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const superadminRoutes = require("./routes/superadminRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const contactRoutes = require("./routes/contactRoutes");
const cartRoutes = require("./routes/cartRoutes");
const flashcardRoutes = require('./routes/flashcardRoutes');
const statsRoutes = require("./routes/statsRoutes");

// Logging middleware
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logsDir, "access.log"),
  { flags: "a" }
);

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: accessLogStream,
  })
);

// Performance monitoring
app.use(performanceMonitor);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const MONGO_URL =
  process.env.MONGO_URL_ATLAS

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("mongodb connected successfully");
  })
  .catch((err) => {
    console.log("err in mongodb connection:", err);
    process.exit(1);
  });

app.use("/auth", authRoutes);
app.use("/courses", courseRoutes);

// contact form
app.use('/contact', contactRoutes);

// cart routes
app.use('/cart', cartRoutes);

//teacher routes
app.use("/teacher", teacherRoutes);

// student routes
app.use("/student", studentRoutes);

// admin routes
app.use("/admin", adminRoutes);

// superadmin routes
app.use("/superadmin", superadminRoutes);

// assignment routes
app.use("/assignments", assignmentRoutes);

// flashcard routes
app.use('/api/flashcards', flashcardRoutes);

// stats routes
app.use("/stats", statsRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to server");
});

// Error handling middlewares (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(3000, () => {
  console.log("backend server is running on port 3000....");
});
