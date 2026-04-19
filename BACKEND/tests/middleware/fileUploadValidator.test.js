const {
  validateFiles,
  multerFileFilter,
  MIME,
  SIZE,
} = require("../../middleware/fileUploadValidator");

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("fileUploadValidator middleware", () => {
  test("multerFileFilter accepts allowed mime types", () => {
    const cb = jest.fn();

    multerFileFilter({}, { mimetype: "image/jpeg" }, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test("multerFileFilter rejects unsupported mime types", () => {
    const cb = jest.fn();

    multerFileFilter({}, { mimetype: "application/x-msdownload" }, cb);

    expect(cb).toHaveBeenCalledTimes(1);
    const [error, accepted] = cb.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(accepted).toBe(false);
  });

  test("fails when required fields are missing", () => {
    const middleware = validateFiles({ requiredFields: ["image"] });
    const req = { files: [] };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Missing required file(s): image"),
      }),
    );
  });

  test("fails when field-specific mime type does not match", () => {
    const middleware = validateFiles({
      fieldTypes: { image: "IMAGE" },
    });

    const req = {
      files: [{ fieldname: "image", mimetype: "application/pdf", size: 20 }],
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Invalid file type for "image"'),
      }),
    );
  });

  test("fails when file exceeds per-type size limit", () => {
    const middleware = validateFiles();
    const req = {
      files: [
        {
          fieldname: "image",
          originalname: "big.jpg",
          mimetype: MIME.IMAGE[0],
          size: SIZE.IMAGE + 1,
        },
      ],
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("exceeds the"),
      }),
    );
  });

  test("calls next for valid files", () => {
    const middleware = validateFiles({
      requiredFields: ["image"],
      fieldTypes: { image: "IMAGE" },
    });

    const req = {
      files: [
        {
          fieldname: "image",
          originalname: "ok.png",
          mimetype: MIME.IMAGE[1],
          size: 1024,
        },
      ],
    };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
