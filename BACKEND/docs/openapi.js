const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "LMS API Documentation",
    version: "1.0.0",
    description:
      "OpenAPI documentation for LMS API endpoints including Student, SuperAdmin, and Cart functionality.",
  },
  servers: [
    {
      url: process.env.API_BASE_URL || "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Student", description: "Student-related operations" },
    { name: "SuperAdmin", description: "SuperAdmin operations" },
    { name: "Cart", description: "Shopping cart operations" },
  ],
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
          email: { type: "string", format: "email", example: "john.doe@example.com" },
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
            example: [
              "60d0fe4f5311236168a109ca",
              "60d0fe4f5311236168a109cb",
            ],
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
        description: "Simple test endpoint to verify student routes are working",
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
        description: "Retrieve all courses the authenticated student is enrolled in",
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
              schema: { $ref: "#/components/schemas/UpdateEnrollCoursesRequest" },
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
        description: "Retrieve courses associated with the authenticated student",
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
        description: "Browse all courses available on the platform (public access)",
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
                          items: { $ref: "#/components/schemas/EnrolledCourse" },
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
          403: { description: "Forbidden - Not a student or not resource owner" },
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
                          items: { $ref: "#/components/schemas/StudentProgress" },
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
              schema: { $ref: "#/components/schemas/UpdateEnrollCoursesRequest" },
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
  },
};

module.exports = openApiSpec;