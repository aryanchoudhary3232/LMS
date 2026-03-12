const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

//  Middleware to verify any logged-in user (Student / Teacher / Admin)
function verify(req, res, next) {
  try {
    let token;
    
    // Check for token in Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = authHeader.split(" ")[1];
    }
    // If no auth header, check query params 
    else if (req.query.token) {
      token = req.query.token;
    }
    // Also check if token is in the body
    else if (req.body && req.body.token) {
      token = req.body.token;
    }
    
    if (!token) {
      return res.status(401).json({ message: "Access denied, no token provided" });
    }

    // Extract and verify token
    const payload = jwt.verify(token, "aryan123"); // Secret key

    req.user = payload; // Attach payload to request
    next();
  } catch (error) {
    console.error("Error in verify middleware:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

//  Middleware to verify Admin only
async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Access denied, no token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "aryan123");

    // Optional: Check admin exists in DB
    const admin = await Admin.findById(decoded._id);
    if (!admin || (admin.role.toLowerCase() !== "admin" && admin.role.toLowerCase() !== "superadmin")) {
      return res.status(403).json({ message: "Access denied, Admins only" });
    }

    req.user = admin; // Attach admin object to request
    next();
  } catch (error) {
    console.error("Error in verifyAdmin middleware:", error);
    return res.status(403).json({ message: "Access denied or invalid token" });
  }
}

//  Middleware to verify SuperAdmin only
async function verifySuperAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Access denied, no token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "aryan123");

    // Check if user is SuperAdmin
    const admin = await Admin.findById(decoded._id);
    if (!admin || admin.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access denied, SuperAdmins only" });
    }

    req.user = admin; // Attach admin object to request
    next();
  } catch (error) {
    console.error("Error in verifySuperAdmin middleware:", error);
    return res.status(403).json({ message: "Access denied or invalid token" });
  }
}

// Middleware to verify Teacher only
function verifyTeacher(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Access denied, no user in request" });
    }
    if (req.user.role !== "Teacher") {
      return res.status(403).json({ message: "Only teachers can access this resource" });
    }
    next();
  } catch (error) {
    console.error("Error in verifyTeacher middleware:", error);
    return res.status(500).json({ message: "Server error" });
  }
}


module.exports = { verify, verifyAdmin, verifySuperAdmin, verifyTeacher };
