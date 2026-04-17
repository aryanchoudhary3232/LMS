const jwt = require("jsonwebtoken");
const { buildSchema } = require("graphql");
const { Types } = require("mongoose");
const Course = require("../models/Course");
const Student = require("../models/Student");
const Cart = require("../models/Cart");
const { normalizePublicAssetUrl } = require("../utils/assetUrl");

const JWT_SECRET = "aryan123";

const schema = buildSchema(`
  type Course {
    _id: ID!
    title: String
    description: String
    image: String
    category: String
    level: String
    price: Float
    rating: Float
    ratingCount: Int
    studentCount: Int
  }

  type CourseRef {
    _id: ID!
  }

  type EnrolledCourse {
    _id: ID!
    course: CourseRef
  }

  type Me {
    _id: ID!
    role: String
    enrolledCourses: [EnrolledCourse!]!
  }

  type AddToCartPayload {
    success: Boolean!
    message: String!
  }

  type Query {
    courses(query: String, category: String, level: String): [Course!]!
    enrolledCourses: [EnrolledCourse!]!
    me: Me
  }

  type Mutation {
    addToCart(courseId: ID!): AddToCartPayload!
  }
`);

function extractAuthUser(headers = {}) {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || typeof authHeader !== "string") return null;

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function computeRatingSummary(ratings = []) {
  if (!Array.isArray(ratings) || ratings.length === 0) {
    return { average: 0, count: 0 };
  }

  const total = ratings.reduce(
    (sum, entry) => sum + (Number(entry.rating) || 0),
    0,
  );
  const average = Math.round((total / ratings.length) * 10) / 10;
  return { average, count: ratings.length };
}

function mapCourse(courseDoc, req) {
  const plain =
    typeof courseDoc.toObject === "function" ? courseDoc.toObject() : courseDoc;
  const summary = computeRatingSummary(plain.ratings);

  return {
    _id: plain._id.toString(),
    title: plain.title || "",
    description: plain.description || "",
    image: normalizePublicAssetUrl(plain.image || "", req),
    category: plain.category || "",
    level: plain.level || "",
    price: Number(plain.price) || 0,
    rating: summary.average,
    ratingCount: summary.count,
    studentCount: Array.isArray(plain.students) ? plain.students.length : 0,
  };
}

function mapEnrolledCourse(enrollment) {
  if (!enrollment) return null;

  const enrollmentId = enrollment._id ? enrollment._id.toString() : "";
  const courseId = enrollment.course
    ? typeof enrollment.course === "object"
      ? enrollment.course._id?.toString() || ""
      : enrollment.course.toString()
    : "";

  if (!enrollmentId || !courseId) return null;

  return {
    _id: enrollmentId,
    course: {
      _id: courseId,
    },
  };
}

async function requireStudent(context) {
  const user = context?.user || null;
  if (!user || user.role !== "Student" || !user._id) {
    return null;
  }

  return Student.findById(user._id).select("_id role enrolledCourses");
}

const root = {
  courses: async ({ query, category, level }, context) => {
    const searchQuery = {};

    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (category) {
      searchQuery.category = category;
    }

    if (level) {
      searchQuery.level = level;
    }

    const courses = await Course.find(searchQuery);
    return courses.map((course) => mapCourse(course, context?.req));
  },

  enrolledCourses: async (_args, context) => {
    const student = await requireStudent(context);
    if (!student) return [];

    const enrollments = Array.isArray(student.enrolledCourses)
      ? student.enrolledCourses
      : [];

    return enrollments.map(mapEnrolledCourse).filter(Boolean);
  },

  me: async (_args, context) => {
    const student = await requireStudent(context);
    if (!student) return null;

    const enrollments = Array.isArray(student.enrolledCourses)
      ? student.enrolledCourses
      : [];

    return {
      _id: student._id.toString(),
      role: student.role,
      enrolledCourses: enrollments.map(mapEnrolledCourse).filter(Boolean),
    };
  },

  addToCart: async ({ courseId }, context) => {
    const student = await requireStudent(context);
    if (!student) {
      return {
        success: false,
        message: "Only authenticated students can add courses to cart",
      };
    }

    if (!Types.ObjectId.isValid(courseId)) {
      return {
        success: false,
        message: "Invalid course id",
      };
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return {
        success: false,
        message: "Course not found",
      };
    }

    const alreadyOwned = (student.enrolledCourses || []).some(
      (entry) => entry?.course?.toString() === courseId.toString(),
    );

    if (alreadyOwned) {
      return {
        success: false,
        message: "You already own this course",
      };
    }

    let cart = await Cart.findOne({ student: student._id });
    if (!cart) {
      cart = new Cart({ student: student._id, items: [] });
    }

    const isInCart = (cart.items || []).some(
      (item) => item?.course?.toString() === courseId.toString(),
    );

    if (isInCart) {
      return {
        success: false,
        message: "Course is already in cart",
      };
    }

    cart.items.push({
      course: courseId,
      addedAt: new Date(),
    });

    await cart.save();

    return {
      success: true,
      message: "Course added to cart",
    };
  },
};

function createGraphQLContext(req) {
  const rawReq = req?.raw || req;
  const headers = rawReq?.headers || {};

  return {
    req: rawReq,
    user: extractAuthUser(headers),
  };
}

module.exports = {
  schema,
  root,
  createGraphQLContext,
};
