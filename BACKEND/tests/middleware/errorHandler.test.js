const { errorHandler, notFound } = require("../../middleware/errorHandler");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("errorHandler middleware", () => {
  test("handles mongoose validation errors", () => {
    const err = {
      name: "ValidationError",
      errors: {
        email: { message: "Email is required" },
      },
    };

    const res = createRes();
    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation Error",
      errors: ["Email is required"],
    });
  });

  test("handles duplicate key errors", () => {
    const err = { code: 11000 };

    const res = createRes();
    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Duplicate field value entered",
    });
  });

  test("handles file type errors", () => {
    const err = { message: 'File type "text/html" is not allowed' };

    const res = createRes();
    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'File type "text/html" is not allowed',
    });
  });

  test("handles default errors", () => {
    const err = { statusCode: 503, message: "Service unavailable" };

    const res = createRes();
    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Service unavailable",
    });
  });
});

describe("notFound middleware", () => {
  test("creates 404 error and forwards to next", () => {
    const req = { originalUrl: "/missing" };
    const next = jest.fn();

    notFound(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const errorArg = next.mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(Error);
    expect(errorArg.statusCode).toBe(404);
    expect(errorArg.message).toContain("Not Found - /missing");
  });
});
