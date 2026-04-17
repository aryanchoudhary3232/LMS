const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { isTokenBlacklisted } = require("./authBlacklist");

const JWT_SECRET = process.env.JWT_SECRET || "aryan123";

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === "string") {
    return authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
  }

  if (req.query.token) return req.query.token;
  if (req.body && req.body.token) return req.body.token;

  return null;
}

async function decodeToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  const blacklisted = await isTokenBlacklisted(token, payload);

  if (blacklisted) {
    const error = new Error("Token has been revoked");
    error.statusCode = 403;
    throw error;
  }

  return payload;
}

//  Middleware to verify any logged-in user (Student / Teacher / Admin)
async function verify(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: "Access denied, no token provided" });
    }

    // Extract and verify token
    const payload = await decodeToken(token);

    req.token = token;
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
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "Access denied, no token provided" });
    }

    const decoded = await decodeToken(token);

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
    let decoded = req.user || null;
    let token = req.token || null;

    if (!decoded) {
      token = getTokenFromRequest(req);

      if (!token) {
        return res.status(401).json({ message: "Access denied, no token provided" });
      }

      decoded = await decodeToken(token);
    }

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
