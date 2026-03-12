function respond(res, status = 200, success = true, message = "", data, meta) {
  const payload = {
    success,
    error: !success,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
}

function notFound(res, entity = "Resource", message) {
  return respond(res, 404, false, message || `${entity} not found`);
}

module.exports = respond;
module.exports.default = respond;
module.exports.respond = respond;
module.exports.notFound = notFound;