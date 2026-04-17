const {
  paramSanitizer,
  validateParams,
} = require("../../middleware/paramSanitizer");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("paramSanitizer middleware", () => {
  test("rejects invalid known object id params", () => {
    const req = { params: { courseId: "invalid-id" } };
    const res = createRes();
    const next = jest.fn();

    paramSanitizer(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Invalid courseId"),
      }),
    );
  });

  test("passes through unrelated params", () => {
    const req = { params: { slug: "my-course" } };
    const res = createRes();
    const next = jest.fn();

    paramSanitizer(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("validateParams factory checks only selected params", () => {
    const middleware = validateParams("teacherId");
    const req = {
      params: {
        teacherId: "507f1f77bcf86cd799439011",
        courseId: "not-validated-here",
      },
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
