const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "LMS API Documentation",
    version: "1.0.0",
    description: "OpenAPI documentation for LMS API endpoints including SuperAdmin and Cart functionality.",
  },
  servers: [
    {
      url: process.env.API_BASE_URL || "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "SuperAdmin" },
    { name: "Cart" },
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
          }
        },
      },
      Course: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          image: { type: "string" },
        },
      },
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
      UpdateEnrollCoursesRequest: {
        type: "object",
        required: ["courseIds"],
        properties: {
          courseIds: {
            type: "array",
            items: { type: "string" },
            description: "Array of course IDs to enroll in",
          },
        },
      },
      EnrolledCourse: {
        type: "object",
        properties: {
          course: { $ref: "#/components/schemas/Course" },
          enrolledAt: { type: "string", format: "date-time" },
          progress: { type: "number" },
          avgQuizScore: { type: "number" },
          completedQuizzes: { type: "number" },
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
                    message: { type: "string", example: "Course is already in cart" },
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
        description: "Process payment for cart items and enroll student in selected courses",
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
                schema: { $ref: "#/components/schemas/UpdateEnrollCoursesResponse" },
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
                    message: { type: "string", example: "No courses supplied for enrollment" },
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
