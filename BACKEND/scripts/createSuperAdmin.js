const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

// MongoDB connection string
const MONGO_URL =
  process.env.MONGO_URL_ATLAS ||
  "mongodb+srv://aryan:aryan123@cluster0.qxutmim.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// SuperAdmin credentials
const SUPERADMIN_DATA = {
  name: "superadmin",
  email: "superadmin@gmail.com",
  password: "Superadmin123",
  role: "SuperAdmin"
};

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB successfully");

    // Check if superadmin already exists
    const existingSuperAdmin = await Admin.findOne({ 
      email: SUPERADMIN_DATA.email 
    });

    if (existingSuperAdmin) {
      console.log("⚠️  SuperAdmin already exists with this email");
      console.log("Email:", existingSuperAdmin.email);
      console.log("Role:", existingSuperAdmin.role);
      
      // Update to SuperAdmin role if not already
      if (existingSuperAdmin.role !== "SuperAdmin") {
        existingSuperAdmin.role = "SuperAdmin";
        await existingSuperAdmin.save();
        console.log("✅ Updated existing admin to SuperAdmin role");
      }
    } else {
      // Hash the password
      console.log("Creating new SuperAdmin...");
      const hashedPassword = await bcrypt.hash(SUPERADMIN_DATA.password, 10);

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
