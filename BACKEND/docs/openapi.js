const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "LMS SuperAdmin API",
    version: "1.0.0",
    description: "OpenAPI documentation for SuperAdmin endpoints only.",
  },
  servers: [
    {
      url: process.env.API_BASE_URL || "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "SuperAdmin" },
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
  },
};

module.exports = openApiSpec;
