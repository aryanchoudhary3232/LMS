const { validate } = require("../../middleware/inputValidator");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("inputValidator middleware", () => {
  test("rejects missing required field", () => {
    const middleware = validate({
      email: { type: "email", required: true },
    });

    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Validation failed",
        errors: expect.arrayContaining(["email is required"]),
      }),
    );
  });

  test("rejects unknown fields when allowUnknown is false", () => {
    const middleware = validate(
      {
        name: { type: "string", required: true },
      },
      { allowUnknown: false },
    );

    const req = { body: { name: "Aryan", extra: "x" } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining(["Unknown field: extra"]),
      }),
    );
  });

  test("validates source=query when configured", () => {
    const middleware = validate(
      {
        page: { type: "number", required: true, min: 1, integer: true },
      },
      { source: "query" },
    );

    const req = { query: { page: "2" } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("rejects invalid json string", () => {
    const middleware = validate({
      chapters: { type: "jsonString", required: true },
    });

    const req = { body: { chapters: "{not-json}" } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining(["chapters must be valid JSON"]),
      }),
    );
  });
});
