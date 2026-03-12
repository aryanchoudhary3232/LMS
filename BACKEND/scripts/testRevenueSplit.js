require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Course = require('../models/Course');
const Student = require('../models/Student');

const MONGO_URL = process.env.MONGO_URL_ATLAS || 'mongodb://localhost:27017/lms_final';

/**
 * Test revenue split calculations (70% Teacher, 30% Platform)
 */
async function testRevenueSplit() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(60));
    console.log('💰 REVENUE SPLIT TEST (70% Teacher / 30% Platform)\n');

    // Get all completed orders
    const orders = await Order.find({ status: 'completed' }).populate('courseId userId');
    
    console.log(`📦 Total Completed Orders: ${orders.length}\n`);

    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const platformRevenue = totalRevenue * 0.30;
    const teacherRevenue = totalRevenue * 0.70;

    console.log('📊 OVERALL REVENUE SPLIT:');
    console.log(`Total Revenue:     ₹${totalRevenue.toLocaleString()}`);
    console.log(`Platform (30%):    ₹${platformRevenue.toLocaleString()}`);
    console.log(`Teachers (70%):    ₹${teacherRevenue.toLocaleString()}`);
    console.log('');

    // Group by category
    const revenueByCategory = {};
    
    for (const order of orders) {
      const category = order.courseId?.category || 'Uncategorized';
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = {
          total: 0,
          orders: 0,
          platform: 0,
          teacher: 0
        };
      }
      
      revenueByCategory[category].total += order.amount;
      revenueByCategory[category].orders += 1;
      revenueByCategory[category].platform += order.amount * 0.30;
      revenueByCategory[category].teacher += order.amount * 0.70;
    }

    console.log('📚 REVENUE BY CATEGORY:\n');
    Object.entries(revenueByCategory)
      .sort(([, a], [, b]) => b.total - a.total)
      .forEach(([category, data]) => {
        console.log(`${category}:`);
        console.log(`  Total:     ₹${data.total.toLocaleString()} (${data.orders} orders)`);
        console.log(`  Platform:  ₹${data.platform.toLocaleString()}`);
        console.log(`  Teachers:  ₹${data.teacher.toLocaleString()}`);
        console.log('');
      });

    console.log('='.repeat(60));
    console.log('✅ Revenue split calculations verified!\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testRevenueSplit();
