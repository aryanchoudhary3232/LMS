const respond = require("../../utils/respond");
const { notFound } = require("../../utils/respond");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("respond utility", () => {
  test("builds success payload with data and meta", () => {
    const res = createRes();

    respond(res, 200, true, "ok", { id: 1 }, { page: 1 });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      error: false,
      message: "ok",
      data: { id: 1 },
      meta: { page: 1 },
    });
  });

  test("omits optional keys when not provided", () => {
    const res = createRes();

    respond(res, 201, true, "created");

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      error: false,
      message: "created",
    });
  });

  test("returns standard not-found response", () => {
    const res = createRes();

    notFound(res, "Course");

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: true,
      message: "Course not found",
    });
  });
});
