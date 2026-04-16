const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "LMS API Documentation",
    version: "1.0.0",
    description:
      "OpenAPI documentation for LMS API endpoints including Auth, Student, Teacher, SuperAdmin, and Cart functionality.",
  },
  servers: [
    {
      url: process.env.API_BASE_URL || "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Student", description: "Student-related operations" },
    { name: "Teacher", description: "Teacher-related operations" },
    { name: "Admin", description: "Administrator operations" },
    { name: "SuperAdmin", description: "SuperAdmin operations" },
    { name: "Cart", description: "Shopping cart operations" },
    { name: "Auth", description: "Authentication and user management" },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiMessage: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "boolean" },
          message: { type: "string" },
        },
      },
      RestoreUserRequest: {
        type: "object",
        required: ["userType"],
        properties: {
          userType: {
            type: "string",
            enum: ["Student", "Teacher", "Admin"],
            example: "Student",
          },
        },
      },

      // ── Student Schemas (from main) ──────────────────────────────────────
      Student: {
        type: "object",
        properties: {
          _id: { type: "string", example: "60d0fe4f5311236168a109ca" },
          name: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john.doe@example.com",
          },
          enrolledCourses: {
            type: "array",
            items: { $ref: "#/components/schemas/EnrolledCourse" },
          },
          streak: { type: "number", example: 5 },
          studentProgress: {
            type: "array",
            items: { $ref: "#/components/schemas/StudentProgress" },
          },
        },
      },
      EnrolledCourse: {
        type: "object",
        properties: {
          course: {
            type: "object",
            properties: {
              _id: { type: "string" },
              title: { type: "string" },
              image: { type: "string" },
              price: { type: "number" },
              category: { type: "string" },
              level: {
                type: "string",
                enum: ["Beginner", "Intermediate", "Advanced"],
              },
            },
          },
          enrolledAt: { type: "string", format: "date-time" },
          avgQuizScore: { type: "number", example: 85 },
          completedQuizzes: { type: "number", example: 3 },
          highestScore: { type: "number", example: 95 },
        },
      },
      StudentProgress: {
        type: "object",
        properties: {
          date: { type: "string", format: "date" },
          minutes: { type: "number", minimum: 1, maximum: 1440, example: 60 },
        },
      },
      Course: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          image: { type: "string" },
          category: { type: "string" },
          level: {
            type: "string",
            enum: ["Beginner", "Intermediate", "Advanced"],
          },
          price: { type: "number" },
          duration: { type: "string" },
          chapters: { type: "array", items: { type: "object" } },
        },
      },
      UpdateEnrollCoursesRequest: {
        type: "object",
        required: ["courseIds"],
        properties: {
          courseIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            description: "Array of course IDs to enroll in",
            example: ["60d0fe4f5311236168a109ca", "60d0fe4f5311236168a109cb"],
          },
        },
      },
      RazorpayCreateOrderResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          error: { type: "boolean", example: false },
          message: { type: "string", example: "Razorpay order created successfully" },
          data: {
            type: "object",
            properties: {
              orderId: { type: "string", example: "order_QX8M7abcd12345" },
              keyId: { type: "string", example: "rzp_test_xxxxx" },
              amount: { type: "number", example: 99900, description: "Amount in paise" },
              amountInRupees: { type: "number", example: 999 },
              currency: { type: "string", example: "INR" },
              courseIds: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
      VerifyRazorpayPaymentRequest: {
        type: "object",
        required: ["courseIds", "razorpayOrderId", "razorpayPaymentId", "razorpaySignature"],
        properties: {
          courseIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
          razorpayOrderId: { type: "string", example: "order_QX8M7abcd12345" },
          razorpayPaymentId: { type: "string", example: "pay_QX8N3abcd12345" },
          razorpaySignature: { type: "string", example: "2f6be6a5..." },
        },
      },
      VerifyRazorpayPaymentResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          error: { type: "boolean", example: false },
          message: { type: "string", example: "Enrollment completed successfully" },
          data: {
            type: "object",
            properties: {
              cart: { $ref: "#/components/schemas/Cart" },
              enrolledCourses: {
                type: "array",
                items: { $ref: "#/components/schemas/EnrolledCourse" },
              },
              payment: {
                type: "object",
                properties: {
                  orderId: { type: "string" },
                  paymentId: { type: "string" },
                  status: { type: "string", example: "captured" },
                },
              },
            },
          },
        },
      },
      QuizSubmitRequest: {
        type: "object",
        required: ["courseId", "chapterId", "topicId", "answerQuiz"],
        properties: {
          courseId: { type: "string", example: "60d0fe4f5311236168a109ca" },
          chapterId: { type: "string", example: "60d0fe4f5311236168a109cb" },
          topicId: { type: "string", example: "60d0fe4f5311236168a109cc" },
          answerQuiz: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionId: { type: "string" },
                selectedOption: { type: "string" },
              },
            },
            minItems: 1,
          },
        },
      },
      StudentProgressRequest: {
        type: "object",
        required: ["minutes"],
        properties: {
          minutes: {
            type: "number",
            minimum: 1,
            maximum: 1440,
            example: 60,
            description: "Learning minutes for today (1-1440)",
          },
        },
      },
      MarkTopicCompleteRequest: {
        type: "object",
        required: ["courseId", "chapterId", "topicId"],
        properties: {
          courseId: { type: "string", example: "60d0fe4f5311236168a109ca" },
          chapterId: { type: "string", example: "60d0fe4f5311236168a109cb" },
          topicId: { type: "string", example: "60d0fe4f5311236168a109cc" },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          error: { type: "boolean", example: false },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "boolean", example: true },
          message: { type: "string" },
        },
      },

      // ── Cart Schemas (from sudhan_swagger) ───────────────────────────────
      CartItem: {
        type: "object",
        properties: {
          course: { $ref: "#/components/schemas/Course" },
          addedAt: { type: "string", format: "date-time" },
        },
      },
      Cart: {
        type: "object",
        properties: {
          _id: { type: "string" },
          student: { type: "string" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/CartItem" },
          },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CartResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { $ref: "#/components/schemas/Cart" },
        },
      },
      UpdateEnrollCoursesResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              cart: { $ref: "#/components/schemas/Cart" },
              enrolledCourses: {
                type: "array",
                items: { $ref: "#/components/schemas/EnrolledCourse" },
              },
            },
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "role"],
        properties: {
          name: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: { type: "string", minLength: 6, example: "password123" },
          role: {
            type: "string",
            enum: ["Student", "Teacher", "Admin", "SuperAdmin"],
            example: "Student",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: { type: "string", example: "password123" },
        },
      },
      ApproveRejectTeacherRequest: {
        type: "object",
        properties: {
          notes: {
            type: "string",
            description: "Optional notes included in the verification decision",
            example: "Verified qualifications via phone interview",
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          token: { type: "string" },
          data: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
            },
          },
          success: { type: "boolean" },
          error: { type: "boolean" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          otp: { type: "string", example: "123456" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["email", "otp", "newPassword"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          otp: { type: "string", example: "123456" },
          newPassword: {
            type: "string",
            minLength: 6,
            example: "newpassword123",
          },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "John Smith" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["oldPassword", "newPassword"],
        properties: {
          oldPassword: { type: "string", example: "oldpassword123" },
          newPassword: {
            type: "string",
            minLength: 6,
            example: "newpassword123",
          },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string" },
          streak: { type: "number" },
          bestStreak: { type: "number" },
          lastLogin: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    // ─────────────────────────────────────────────
    // Student Routes
    // ─────────────────────────────────────────────
    "/student/test": {
      get: {
        tags: ["Student"],
        summary: "Test student routes",
        description:
          "Simple test endpoint to verify student routes are working",
        security: [],
        responses: {
          200: {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    timestamp: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/student": {
      get: {
        tags: ["Student"],
        summary: "Get all students",
        description: "Retrieve list of all students with basic information",
        responses: {
          200: {
            description: "Students retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              _id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/student/profile": {
      get: {
        tags: ["Student"],
        summary: "Get student profile",
        description:
          "Retrieve authenticated student's profile with enrolled courses and statistics",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Student" },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { description: "Unauthorized - Invalid or missing token" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/dashboard": {
      get: {
        tags: ["Student"],
        summary: "Get student dashboard",
        description: "Retrieve dashboard data for authenticated student",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Dashboard data retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/my-courses": {
      get: {
        tags: ["Student"],
        summary: "Get student's enrolled courses",
        description:
          "Retrieve all courses the authenticated student is enrolled in",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Enrolled courses retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/update-enrollCourses": {
      put: {
        tags: ["Student"],
        summary: "Update enrolled courses",
        description: "Update the list of courses the student is enrolled in",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateEnrollCoursesRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Enrollment updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/quiz_submit": {
      post: {
        tags: ["Student"],
        summary: "Submit quiz answers",
        description: "Submit quiz answers for a specific topic in a course",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/QuizSubmitRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Quiz submitted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not enrolled or not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/courses": {
      get: {
        tags: ["Student"],
        summary: "Get courses by student ID",
        description:
          "Retrieve courses associated with the authenticated student",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Courses retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Course" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/quiz-submissions": {
      get: {
        tags: ["Student"],
        summary: "Get quiz submissions",
        description:
          "Retrieve all quiz submissions for the authenticated student (aggregated)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Quiz submissions retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/streak": {
      get: {
        tags: ["Student"],
        summary: "Get streak statistics",
        description:
          "Retrieve activity streak and analytics for the authenticated student",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Streak stats retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/all-courses": {
      get: {
        tags: ["Student"],
        summary: "Get all available courses",
        description:
          "Browse all courses available on the platform (public access)",
        security: [],
        responses: {
          200: {
            description: "Courses retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Course" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          500: { description: "Server error" },
        },
      },
    },
    "/student/courses/{courseId}": {
      get: {
        tags: ["Student"],
        summary: "Get course by ID",
        description: "Retrieve detailed information about a specific course",
        security: [],
        parameters: [
          {
            in: "path",
            name: "courseId",
            required: true,
            schema: { type: "string" },
            description: "MongoDB ObjectId of the course",
          },
        ],
        responses: {
          200: {
            description: "Course retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Course" },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { description: "Invalid course ID" },
          404: { description: "Course not found" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/courses/{courseId}/enroll": {
      post: {
        tags: ["Student"],
        summary: "Enroll in a course",
        description: "Enroll the authenticated student in a specific course",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "courseId",
            required: true,
            schema: { type: "string" },
            description: "MongoDB ObjectId of the course to enroll in",
          },
        ],
        responses: {
          200: {
            description: "Enrolled successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: { description: "Invalid course ID or already enrolled" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          404: { description: "Course not found" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/enrolled-courses": {
      get: {
        tags: ["Student"],
        summary: "Get enrolled courses",
        description:
          "Retrieve all courses the authenticated student is currently enrolled in",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Enrolled courses retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/EnrolledCourse",
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/progress": {
      post: {
        tags: ["Student"],
        summary: "Record student progress",
        description: "Record learning minutes for the authenticated student",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StudentProgressRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Progress recorded successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: {
            description: "Forbidden - Not a student or not resource owner",
          },
          500: { description: "Server error" },
        },
      },
    },
    "/student/get-progress": {
      get: {
        tags: ["Student"],
        summary: "Get student progress",
        description:
          "Retrieve learning progress history for the authenticated student",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Progress retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/StudentProgress",
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/mark-topic-complete": {
      post: {
        tags: ["Student"],
        summary: "Mark topic as complete",
        description: "Mark a specific topic as completed in a course",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MarkTopicCompleteRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Topic marked as complete",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not enrolled or not a student" },
          500: { description: "Server error" },
        },
      },
    },
    "/student/topic-completion": {
      get: {
        tags: ["Student"],
        summary: "Get topic completion status",
        description:
          "Retrieve completion status for topics in the authenticated student's courses",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "courseId",
            schema: { type: "string" },
            description: "Filter by specific course ID",
          },
        ],
        responses: {
          200: {
            description: "Topic completion status retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Not a student" },
          500: { description: "Server error" },
        },
      },
    },

    // ─────────────────────────────────────────────
    // SuperAdmin Routes
    // ─────────────────────────────────────────────
    "/superadmin/overview": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get platform overview",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Overview data" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },
    "/superadmin/revenue": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get revenue analytics",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Revenue analytics data" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },
    "/superadmin/courses/by-category": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get courses grouped by category",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "includeDeleted",
            schema: { type: "boolean", default: false },
            description: "Include soft-deleted courses",
          },
        ],
        responses: {
          200: { description: "Courses grouped by category" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },
    "/superadmin/courses/deleted": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get deleted courses",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Deleted courses list" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },
    "/superadmin/courses/{courseId}/restore": {
      put: {
        tags: ["SuperAdmin"],
        summary: "Restore deleted course",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "courseId",
            required: true,
            schema: { type: "string" },
            description: "Course id",
          },
        ],
        responses: {
          200: { description: "Course restored" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
          404: { description: "Course not found" },
        },
      },
    },
    "/superadmin/users": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get all users",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "includeDeleted",
            schema: { type: "boolean", default: false },
            description: "Include soft-deleted users",
          },
        ],
        responses: {
          200: { description: "Users list" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },
    "/superadmin/users/deleted": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get deleted users",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Deleted users list" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },
    "/superadmin/users/{userId}/restore": {
      put: {
        tags: ["SuperAdmin"],
        summary: "Restore deleted user",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string" },
            description: "User id",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RestoreUserRequest" },
            },
          },
        },
        responses: {
          200: { description: "User restored" },
          400: { description: "Invalid user type" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
          404: { description: "User not found" },
        },
      },
    },
    "/superadmin/analytics/user-growth": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get user growth analytics",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "period",
            schema: { type: "integer", default: 30, minimum: 1 },
            description: "Number of days",
          },
        ],
        responses: {
          200: { description: "User growth analytics" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },
    "/superadmin/analytics/teacher-performance": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get teacher performance analytics",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Teacher performance analytics" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },
    "/superadmin/analytics/course-performance": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get course performance analytics",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Course performance analytics" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },
    "/superadmin/analytics/enrollment-trends": {
      get: {
        tags: ["SuperAdmin"],
        summary: "Get daily enrollments and revenue trends",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "period",
            schema: { type: "integer", default: 30, minimum: 1 },
            description: "Number of days",
          },
        ],
        responses: {
          200: { description: "Enrollment trends" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (SuperAdmin only)" },
        },
      },
    },

    // ─────────────────────────────────────────────
    // Admin Routes
    // ─────────────────────────────────────────────
    "/admin/dashboard": {
      get: {
        tags: ["Admin"],
        summary: "Get admin dashboard stats",
        description: "Retrieve counts for students, teachers, and courses",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Dashboard data retrieved" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List students and teachers",
        description: "Get all active students and teachers (passwords excluded)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Users retrieved successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
        },
      },
    },
    "/admin/deleted-members": {
      get: {
        tags: ["Admin"],
        summary: "Get soft-deleted members",
        description: "Returns deleted students and teachers with deletion metadata",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Deleted members retrieved" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
        },
      },
    },
    "/admin/teachers/{teacherId}": {
      get: {
        tags: ["Admin"],
        summary: "Get teacher details",
        description: "Retrieve a teacher profile with course info",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "teacherId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Teacher ID",
          },
        ],
        responses: {
          200: { description: "Teacher retrieved" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
          404: { description: "Teacher not found" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Soft delete teacher",
        description: "Soft deletes teacher and their courses",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "teacherId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Teacher ID",
          },
        ],
        responses: {
          200: { description: "Teacher deleted" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
          404: { description: "Teacher not found" },
        },
      },
    },
    "/admin/teachers/{teacherId}/approve": {
      put: {
        tags: ["Admin"],
        summary: "Approve teacher verification",
        description: "Approve a teacher's verification request with optional notes",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "teacherId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Teacher ID",
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApproveRejectTeacherRequest" },
            },
          },
        },
        responses: {
          200: { description: "Teacher approved" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
          404: { description: "Teacher not found" },
        },
      },
    },
    "/admin/teachers/{teacherId}/reject": {
      put: {
        tags: ["Admin"],
        summary: "Reject teacher verification",
        description: "Reject a teacher's verification with optional notes",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "teacherId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Teacher ID",
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApproveRejectTeacherRequest" },
            },
          },
        },
        responses: {
          200: { description: "Teacher rejected" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
          404: { description: "Teacher not found" },
        },
      },
    },
    "/admin/students/{studentId}": {
      delete: {
        tags: ["Admin"],
        summary: "Soft delete student",
        description: "Soft deletes a student account",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "studentId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Student ID",
          },
        ],
        responses: {
          200: { description: "Student deleted" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
          404: { description: "Student not found" },
        },
      },
    },
    "/admin/courses": {
      get: {
        tags: ["Admin"],
        summary: "List courses",
        description: "Retrieve all non-deleted courses with teacher info",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Courses retrieved" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
        },
      },
    },
    "/admin/courses/{courseId}": {
      get: {
        tags: ["Admin"],
        summary: "Get course details",
        description: "Retrieve a course with enrolled student details",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Course ID",
          },
        ],
        responses: {
          200: { description: "Course retrieved" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
          404: { description: "Course not found" },
        },
      },
    },
    "/admin/courses/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Soft delete course",
        description: "Soft deletes a course",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Course ID",
          },
        ],
        responses: {
          200: { description: "Course deleted" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (Admin only)" },
          404: { description: "Course not found" },
        },
      },
    },

    // ─────────────────────────────────────────────
    // Auth Routes
    // ─────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "Register a new user as Student, Teacher, Admin, or SuperAdmin",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Student registered successfully",
                    },
                    data: { type: "object" },
                    success: { type: "boolean", example: true },
                    error: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error or user already exists",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "User already exists with this email",
                    },
                    success: { type: "boolean", example: false },
                    error: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "User login",
        description: "Authenticate user and return JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          400: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Incorrect password" },
                    success: { type: "boolean", example: false },
                    error: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout current user",
        description: "Invalidate the current session on the client; JWT remains stateless on the server",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Logout acknowledged",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Logged out successfully",
                    },
                    success: { type: "boolean", example: true },
                    error: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        description: "Send OTP to user's email for password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "OTP sent to your email",
                    },
                    success: { type: "boolean", example: true },
                    error: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP",
        description: "Verify the OTP sent to user's email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP verified successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "OTP verified successfully",
                    },
                    success: { type: "boolean", example: true },
                    error: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password",
        description: "Reset user password using OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Password reset successfully",
                    },
                    success: { type: "boolean", example: true },
                    error: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/profile": {
      get: {
        tags: ["Auth"],
        summary: "Get user profile",
        description: "Get current user's profile information",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Profile retrieved successfully",
                    },
                    data: { $ref: "#/components/schemas/UserProfile" },
                    success: { type: "boolean", example: true },
                    error: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
      put: {
        tags: ["Auth"],
        summary: "Update user profile",
        description: "Update current user's profile (name only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Profile updated successfully",
                    },
                    success: { type: "boolean", example: true },
                    error: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/change-password": {
      put: {
        tags: ["Auth"],
        summary: "Change password",
        description: "Change current user's password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password changed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Password changed successfully",
                    },
                    success: { type: "boolean", example: true },
                    error: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ─────────────────────────────────────────────
    // Cart Routes
    // ─────────────────────────────────────────────
    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get cart contents",
        description: "Retrieve the current user's shopping cart with all items",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Cart retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CartResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/cart/add/{courseId}": {
      post: {
        tags: ["Cart"],
        summary: "Add course to cart",
        description: "Add a specific course to the user's shopping cart",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID of the course to add to cart",
          },
        ],
        responses: {
          200: {
            description: "Course added to cart successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CartResponse" },
              },
            },
          },
          400: {
            description: "Course already in cart or already owned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: {
                      type: "string",
                      example: "Course is already in cart",
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          404: { description: "Course not found" },
        },
      },
    },
    "/cart/remove/{courseId}": {
      delete: {
        tags: ["Cart"],
        summary: "Remove course from cart",
        description: "Remove a specific course from the user's shopping cart",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID of the course to remove from cart",
          },
        ],
        responses: {
          200: {
            description: "Course removed from cart successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CartResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          404: { description: "Cart not found" },
        },
      },
    },
    "/cart/clear": {
      delete: {
        tags: ["Cart"],
        summary: "Clear entire cart",
        description: "Remove all items from the user's shopping cart",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Cart cleared successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CartResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          404: { description: "Cart not found" },
        },
      },
    },
    "/cart/create-payment-order": {
      post: {
        tags: ["Cart"],
        summary: "Create Razorpay order",
        description:
          "Create a Razorpay order for selected courses before opening Razorpay checkout on frontend",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateEnrollCoursesRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Razorpay order created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RazorpayCreateOrderResponse",
                },
              },
            },
          },
          400: { description: "Invalid request payload" },
          401: { description: "Unauthorized" },
          500: { description: "Razorpay/server error" },
        },
      },
    },
    "/cart/verify-payment": {
      post: {
        tags: ["Cart"],
        summary: "Verify Razorpay payment and enroll",
        description:
          "Verify Razorpay signature and payment details, then enroll the student into purchased courses",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/VerifyRazorpayPaymentRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Payment verified and enrollment completed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/VerifyRazorpayPaymentResponse",
                },
              },
            },
          },
          400: { description: "Invalid payment details/signature" },
          401: { description: "Unauthorized" },
          500: { description: "Server error" },
        },
      },
    },
    "/cart/update-enroll-courses": {
      put: {
        tags: ["Cart"],
        summary: "Complete purchase and enroll in courses",
        description:
          "Process payment for cart items and enroll student in selected courses",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateEnrollCoursesRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Enrollment completed successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateEnrollCoursesResponse",
                },
              },
            },
          },
          400: {
            description: "Invalid request or no valid courses",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    error: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "No courses supplied for enrollment",
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          404: { description: "Student not found" },
          500: { description: "Internal server error" },
        },
      },
    },

    // ─────────────────────────────────────────────
    // Teacher Routes
    // ─────────────────────────────────────────────
    "/teacher/courses/create_course": {
      post: {
        tags: ["Teacher"],
        summary: "Create course",
        description: "Create a new course with media files and chapter data.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: [
                  "title",
                  "description",
                  "category",
                  "level",
                  "duration",
                  "price",
                  "image",
                  "video",
                  "chapters",
                ],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  level: {
                    type: "string",
                    enum: ["Beginner", "Intermediate", "Advanced"],
                  },
                  duration: { type: "string" },
                  price: { type: "number" },
                  image: { type: "string", format: "binary" },
                  video: { type: "string", format: "binary" },
                  notes: { type: "string", format: "binary" },
                  chapters: {
                    type: "string",
                    description:
                      "JSON string representing course chapters and topics.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Course created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: { description: "Validation or upload error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher/courses/{courseId}": {
      put: {
        tags: ["Teacher"],
        summary: "Update own course",
        description:
          "Update a teacher-owned course and optionally replace files.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Course ID",
          },
        ],
        requestBody: {
          required: false,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  level: {
                    type: "string",
                    enum: ["Beginner", "Intermediate", "Advanced"],
                  },
                  duration: { type: "string" },
                  price: { type: "number" },
                  image: { type: "string", format: "binary" },
                  video: { type: "string", format: "binary" },
                  notes: { type: "string", format: "binary" },
                  chapters: {
                    type: "string",
                    description:
                      "JSON string representing updated chapters and topics.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Course updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Course not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher/courses": {
      get: {
        tags: ["Teacher"],
        summary: "Get teacher courses",
        description: "Retrieve courses created by the authenticated teacher.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Teacher courses retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher/verification/upload": {
      post: {
        tags: ["Teacher"],
        summary: "Upload teacher qualification",
        description: "Upload qualification document for teacher verification.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["qualification"],
                properties: {
                  qualification: {
                    type: "string",
                    format: "binary",
                    description: "Qualification document file",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Qualification uploaded successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: { description: "Invalid or missing file" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher/verification/status": {
      get: {
        tags: ["Teacher"],
        summary: "Get qualification status",
        description: "Get teacher verification status and notes.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Verification status retrieved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher/courses/get_courses": {
      get: {
        tags: ["Teacher"],
        summary: "Get public courses",
        description: "Retrieve all courses (public teacher endpoint).",
        security: [],
        responses: {
          200: {
            description: "Courses retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher/courses/get_course_by_id/{courseId}": {
      get: {
        tags: ["Teacher"],
        summary: "Get course by ID",
        description: "Retrieve a single course by ID.",
        security: [],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Course ID",
          },
        ],
        responses: {
          200: {
            description: "Course retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          404: { description: "Course not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher": {
      get: {
        tags: ["Teacher"],
        summary: "Get teachers",
        description: "Retrieve all teachers with basic details.",
        security: [],
        responses: {
          200: {
            description: "Teachers retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher/metrics": {
      get: {
        tags: ["Teacher"],
        summary: "Get teacher metrics",
        description:
          "Retrieve revenue and customer analytics for teacher dashboard.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "days",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 30 },
            description: "Analytics period in days",
          },
        ],
        responses: {
          200: {
            description: "Metrics retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher/students": {
      get: {
        tags: ["Teacher"],
        summary: "Get enrolled students",
        description: "Retrieve students enrolled in teacher courses.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Students retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    students: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/teacher/dashboard": {
      get: {
        tags: ["Teacher"],
        summary: "Get teacher dashboard",
        description: "Retrieve teacher dashboard overview data.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Dashboard data retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalCourses: { type: "number" },
                    totalStudents: { type: "number" },
                    avgRating: { type: "string" },
                    enrollmentData: {
                      type: "array",
                      items: { type: "object" },
                    },
                    recentActivity: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
};

module.exports = openApiSpec;
