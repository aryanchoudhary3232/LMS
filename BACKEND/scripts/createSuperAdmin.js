const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const Admin = require("../models/Admin");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

// MongoDB connection string
const MONGO_URL = process.env.MONGO_URL_ATLAS || process.env.MONGO_URL;

// SuperAdmin credentials
const SUPERADMIN_DATA = {
  name: process.env.SUPERADMIN_NAME || "superadmin",
  email: (process.env.SUPERADMIN_EMAIL || "superadmin@gmail.com").toLowerCase(),
  password: process.env.SUPERADMIN_PASSWORD || "Superadmin123",
  role: "SuperAdmin",
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createSuperAdmin() {
  try {
    if (!MONGO_URL) {
      throw new Error("Missing MONGO_URL_ATLAS/MONGO_URL in environment");
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB successfully");

    // Check if superadmin already exists
    const emailMatcher = new RegExp(`^${escapeRegex(SUPERADMIN_DATA.email)}$`, "i");
    const existingSuperAdmin = await Admin.findOne({ email: emailMatcher });

    const hashedPassword = await bcrypt.hash(SUPERADMIN_DATA.password, 10);

    if (existingSuperAdmin) {
      console.log("⚠️  SuperAdmin already exists with this email");
      console.log("Email:", existingSuperAdmin.email);
      console.log("Role:", existingSuperAdmin.role);

      // Ensure credentials/role are correct for immediate login access.
      existingSuperAdmin.name = SUPERADMIN_DATA.name;
      existingSuperAdmin.email = SUPERADMIN_DATA.email;
      existingSuperAdmin.password = hashedPassword;
      existingSuperAdmin.role = "SuperAdmin";
      existingSuperAdmin.isDeleted = false;
      existingSuperAdmin.deletedAt = null;
      await existingSuperAdmin.save();
      console.log("✅ Updated existing admin to SuperAdmin with new credentials");
    } else {
      console.log("Creating new SuperAdmin...");

      // Create new SuperAdmin
      const superAdmin = new Admin({
        name: SUPERADMIN_DATA.name,
        email: SUPERADMIN_DATA.email,
        password: hashedPassword,
        role: SUPERADMIN_DATA.role
      });

      await superAdmin.save();
      console.log("✅ SuperAdmin created successfully!");
    }

    console.log("\n📋 SuperAdmin Credentials:");
    console.log("=====================================");
    console.log("Email:", SUPERADMIN_DATA.email);
    console.log("Password:", SUPERADMIN_DATA.password);
    console.log("Role:", SUPERADMIN_DATA.role);
    console.log("=====================================");

    // Close connection
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error creating SuperAdmin:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();
