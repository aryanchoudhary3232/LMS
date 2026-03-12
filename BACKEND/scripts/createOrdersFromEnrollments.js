require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Order = require('../models/Order');

const MONGO_URL = process.env.MONGO_URL_ATLAS || 'mongodb://localhost:27017/lms_final';

/**
 * Create Orders from existing Student enrollments
 * This will populate the Order collection for analytics
 */
async function createOrdersFromEnrollments() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(60));
    console.log('🔄 Creating Orders from Student Enrollments...\n');

    // Get all students with enrollments
    const students = await Student.find({ 
      'enrolledCourses.0': { $exists: true } 
    }).populate('enrolledCourses.course');

    let ordersCreated = 0;
    let ordersSkipped = 0;

    for (const student of students) {
      for (const enrollment of student.enrolledCourses) {
        // Get course details
        const course = await Course.findById(enrollment.course);
        
        if (!course) {
          console.log(`⚠️  Course not found for enrollment: ${enrollment.course}`);
          ordersSkipped++;
          continue;
        }

        // Check if order already exists
        const existingOrder = await Order.findOne({
          userId: student._id,
          courseId: course._id
        });

        if (existingOrder) {
          ordersSkipped++;
          continue;
        }

        // Create order
        await Order.create({
          userId: student._id,
          courseId: course._id,
          amount: course.price || 0,
          status: 'completed',
          createdAt: enrollment.enrolledAt || new Date()
        });

        ordersCreated++;
        console.log(`✅ Created order: ${student.name} -> ${course.title} (₹${course.price})`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Orders Created: ${ordersCreated}`);
    console.log(`⏭️  Orders Skipped (already exist): ${ordersSkipped}`);
    console.log('='.repeat(60));

    // Verify orders
    const totalOrders = await Order.countDocuments({});
    console.log(`\n📦 Total Orders in database: ${totalOrders}`);

    const completedOrders = await Order.countDocuments({ status: 'completed' });
    console.log(`✅ Completed Orders: ${completedOrders}`);

    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = totalRevenue[0]?.total || 0;
    const platformRevenue = totalAmount * 0.30;
    const teacherRevenue = totalAmount * 0.70;
    
    console.log(`💰 Total Revenue: ₹${totalAmount}`);
    console.log(`🏢 Platform Revenue (30%): ₹${platformRevenue}`);
    console.log(`👨‍🏫 Teacher Revenue (70%): ₹${teacherRevenue}`);

    console.log('\n✅ Migration complete!\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createOrdersFromEnrollments();
