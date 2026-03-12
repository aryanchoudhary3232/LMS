require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Admin = require('../models/Admin');

const MONGO_URL = process.env.MONGO_URL_ATLAS || 'mongodb://localhost:27017/lms_final';

/**
 * Migration script to add isDeleted field to all existing documents
 * This ensures consistency across the database
 */
async function migrateIsDeletedField() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');
    console.log('='.repeat(50));
    console.log('🔄 Starting migration to add isDeleted field...\n');

    // Migrate Students
    const studentsUpdated = await Student.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false, deletedAt: null } }
    );
    console.log(`📚 Students updated: ${studentsUpdated.modifiedCount}`);

    // Migrate Teachers
    const teachersUpdated = await Teacher.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false, deletedAt: null } }
    );
    console.log(`👨‍🏫 Teachers updated: ${teachersUpdated.modifiedCount}`);

    // Migrate Courses
    const coursesUpdated = await Course.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false, deletedAt: null } }
    );
    console.log(`📖 Courses updated: ${coursesUpdated.modifiedCount}`);

    // Migrate Admins
    const adminsUpdated = await Admin.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false, deletedAt: null } }
    );
    console.log(`👑 Admins updated: ${adminsUpdated.modifiedCount}`);

    console.log('\n='.repeat(50));
    console.log('✅ Migration completed successfully!');
    console.log('\nVerifying counts...\n');

    // Verify the migration
    const totalStudents = await Student.countDocuments({});
    const studentsWithField = await Student.countDocuments({ isDeleted: { $exists: true } });
    console.log(`Students: ${studentsWithField}/${totalStudents} have isDeleted field`);

    const totalTeachers = await Teacher.countDocuments({});
    const teachersWithField = await Teacher.countDocuments({ isDeleted: { $exists: true } });
    console.log(`Teachers: ${teachersWithField}/${totalTeachers} have isDeleted field`);

    const totalCourses = await Course.countDocuments({});
    const coursesWithField = await Course.countDocuments({ isDeleted: { $exists: true } });
    console.log(`Courses: ${coursesWithField}/${totalCourses} have isDeleted field`);

    const totalAdmins = await Admin.countDocuments({});
    const adminsWithField = await Admin.countDocuments({ isDeleted: { $exists: true } });
    console.log(`Admins: ${adminsWithField}/${totalAdmins} have isDeleted field`);

    console.log('\n✅ All documents now have isDeleted field!');
    console.log('='.repeat(50));

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

migrateIsDeletedField();
