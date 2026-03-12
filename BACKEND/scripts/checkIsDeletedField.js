require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Admin = require('../models/Admin');

const MONGO_URL = process.env.MONGO_URL_ATLAS || 'mongodb://localhost:27017/lms_final';

async function checkDatabase() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');
    console.log('='.repeat(50));
    
    // Count all documents
    const totalStudents = await Student.countDocuments({});
    const totalTeachers = await Teacher.countDocuments({});
    const totalCourses = await Course.countDocuments({});
    const totalAdmins = await Admin.countDocuments({});
    
    console.log('\n📊 TOTAL COUNTS:');
    console.log('Students:', totalStudents);
    console.log('Teachers:', totalTeachers);
    console.log('Courses:', totalCourses);
    console.log('Admins:', totalAdmins);
    
    // Check which documents have isDeleted field
    console.log('\n🔍 CHECKING isDeleted FIELD:');
    
    const studentsWithField = await Student.countDocuments({ isDeleted: { $exists: true } });
    const studentsWithoutField = await Student.countDocuments({ isDeleted: { $exists: false } });
    console.log('Students WITH isDeleted field:', studentsWithField);
    console.log('Students WITHOUT isDeleted field:', studentsWithoutField);
    
    const teachersWithField = await Teacher.countDocuments({ isDeleted: { $exists: true } });
    const teachersWithoutField = await Teacher.countDocuments({ isDeleted: { $exists: false } });
    console.log('Teachers WITH isDeleted field:', teachersWithField);
    console.log('Teachers WITHOUT isDeleted field:', teachersWithoutField);
    
    const coursesWithField = await Course.countDocuments({ isDeleted: { $exists: true } });
    const coursesWithoutField = await Course.countDocuments({ isDeleted: { $exists: false } });
    console.log('Courses WITH isDeleted field:', coursesWithField);
    console.log('Courses WITHOUT isDeleted field:', coursesWithoutField);
    
    const adminsWithField = await Admin.countDocuments({ isDeleted: { $exists: true } });
    const adminsWithoutField = await Admin.countDocuments({ isDeleted: { $exists: false } });
    console.log('Admins WITH isDeleted field:', adminsWithField);
    console.log('Admins WITHOUT isDeleted field:', adminsWithoutField);
    
    // Check counts with current query pattern
    console.log('\n🔎 COUNTS WITH { isDeleted: false }:');
    const studentsNotDeleted = await Student.countDocuments({ isDeleted: false });
    const teachersNotDeleted = await Teacher.countDocuments({ isDeleted: false });
    const coursesNotDeleted = await Course.countDocuments({ isDeleted: false });
    const adminsNotDeleted = await Admin.countDocuments({ isDeleted: false });
    console.log('Students:', studentsNotDeleted);
    console.log('Teachers:', teachersNotDeleted);
    console.log('Courses:', coursesNotDeleted);
    console.log('Admins:', adminsNotDeleted);
    
    // Check counts with better query pattern
    console.log('\n🔎 COUNTS WITH { isDeleted: { $ne: true } }:');
    const studentsNotDeleted2 = await Student.countDocuments({ isDeleted: { $ne: true } });
    const teachersNotDeleted2 = await Teacher.countDocuments({ isDeleted: { $ne: true } });
    const coursesNotDeleted2 = await Course.countDocuments({ isDeleted: { $ne: true } });
    const adminsNotDeleted2 = await Admin.countDocuments({ isDeleted: { $ne: true } });
    console.log('Students:', studentsNotDeleted2);
    console.log('Teachers:', teachersNotDeleted2);
    console.log('Courses:', coursesNotDeleted2);
    console.log('Admins:', adminsNotDeleted2);
    
    console.log('\n='.repeat(50));
    console.log('✅ Check complete!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();
