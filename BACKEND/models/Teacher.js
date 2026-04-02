const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["Teacher"],
    required: true,
  },
  qualificationDoc: {
    url: String,         
    publicId: String,     
    resourceType: String,   
    format: String,        
    bytes: Number,
    uploadedAt: {
      type: Date,
      default: null,
    },
  },
  verificationStatus: {
    type: String,
    enum: ["NotSubmitted", "Pending", "Verified", "Rejected"],
    default: "NotSubmitted",
  },
  verificationNotes: {
    type: String,
    default: "",
  },
  qualificationDetails: {
    degree: {
      type: String,
      default: "",
    },
    institution: {
      type: String,
      default: "",
    },
    specialization: {
      type: String,
      default: "",
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      default: "",
    },
  },
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

const Teacher = mongoose.model("Teacher", teacherSchema);

module.exports = Teacher;
