require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Order = require('../models/Order');

const MONGO_URL = process.env.MONGO_URL_ATLAS || 'mongodb://localhost:27017/lms_final';

async function checkData() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(60));
    
    // Check Orders
    const totalOrders = await Order.countDocuments({});
    console.log('\n📦 ORDERS:');
    console.log('Total Orders:', totalOrders);
    
    if (totalOrders > 0) {
      const orders = await Order.find({}).limit(3);
      console.log('\nSample Orders:');
      orders.forEach(order => {
        console.log(`- Order ID: ${order._id}`);
        console.log(`  Student: ${order.userId}`);
        console.log(`  Course: ${order.courseId}`);
        console.log(`  Amount: ${order.amount}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Date: ${order.createdAt}`);
      });
    }
    
    // Check Students with enrolled courses
    console.log('\n👨‍🎓 STUDENTS WITH ENROLLED COURSES:');
    const studentsWithCourses = await Student.find({ 
      'enrolledCourses.0': { $exists: true } 
    }).select('name email enrolledCourses');
    
    console.log('Students with enrollments:', studentsWithCourses.length);
    studentsWithCourses.forEach(student => {
      console.log(`\n- ${student.name} (${student.email})`);
      console.log(`  Enrolled in ${student.enrolledCourses.length} courses`);
      student.enrolledCourses.forEach(ec => {
        console.log(`  - Course: ${ec.course}, Enrolled: ${ec.enrolledAt}`);
      });
    });
    
    // Check Courses with students
    console.log('\n\n📚 COURSES WITH STUDENTS:');
    const coursesWithStudents = await Course.find({
      'students.0': { $exists: true }
    }).populate('teacher', 'name email').select('title category teacher students');
    
    console.log('Courses with students:', coursesWithStudents.length);
    coursesWithStudents.forEach(course => {
      console.log(`\n- ${course.title}`);
      console.log(`  Category: ${course.category}`);
      console.log(`  Teacher: ${course.teacher ? course.teacher.name : 'NO TEACHER'}`);
      console.log(`  Students enrolled: ${course.students.length}`);
    });
    
    // Check all courses and their teachers
    console.log('\n\n📖 ALL COURSES:');
    const allCourses = await Course.find({}).populate('teacher', 'name email').select('title teacher');
    allCourses.forEach(course => {
      console.log(`- ${course.title} -> Teacher: ${course.teacher ? course.teacher.name : 'NULL/MISSING'}`);
    });
    
    // Check deleted items
    console.log('\n\n🗑️ DELETED ITEMS:');
    const deletedStudents = await Student.find({ isDeleted: true });
    const deletedTeachers = await Teacher.find({ isDeleted: true });
    const deletedCourses = await Course.find({ isDeleted: true });
    
    console.log('Deleted Students:', deletedStudents.length);
    console.log('Deleted Teachers:', deletedTeachers.length);
    console.log('Deleted Courses:', deletedCourses.length);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Check complete!\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
