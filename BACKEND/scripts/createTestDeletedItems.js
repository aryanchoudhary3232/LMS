require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');

const MONGO_URL = process.env.MONGO_URL_ATLAS || 'mongodb://localhost:27017/lms_final';

/**
 * Create some test deleted items for demonstration
 */
async function createTestDeletedItems() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(60));
    console.log('🗑️  Creating Test Deleted Items...\n');

    // Soft delete 1 random student
    const students = await Student.find({ isDeleted: false }).limit(3);
    if (students.length > 0) {
      const studentToDelete = students[Math.floor(Math.random() * students.length)];
      await Student.findByIdAndUpdate(studentToDelete._id, {
        isDeleted: true,
        deletedAt: new Date()
      });
      console.log(`✅ Soft deleted student: ${studentToDelete.name} (${studentToDelete.email})`);
    }

    // Soft delete 1 random course
    const courses = await Course.find({ isDeleted: false }).limit(3);
    if (courses.length > 0) {
      const courseToDelete = courses[Math.floor(Math.random() * courses.length)];
      await Course.findByIdAndUpdate(courseToDelete._id, {
        isDeleted: true,
        deletedAt: new Date()
      });
      console.log(`✅ Soft deleted course: ${courseToDelete.title}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test deleted items created!\n');

    // Show counts
    const deletedStudents = await Student.countDocuments({ isDeleted: true });
    const deletedTeachers = await Teacher.countDocuments({ isDeleted: true });
    const deletedCourses = await Course.countDocuments({ isDeleted: true });

    console.log('📊 Deleted Items Count:');
    console.log(`- Students: ${deletedStudents}`);
    console.log(`- Teachers: ${deletedTeachers}`);
    console.log(`- Courses: ${deletedCourses}`);
    console.log('\n✅ You can now test the restore functionality in SuperAdmin dashboard!\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestDeletedItems();
