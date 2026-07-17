const crypto = require('crypto');

function trustedProxy(req) {
  return req.ips && req.ips.length > 0;
}

module.exports = function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (trustedProxy(req) && incomingId && uuidRegex.test(incomingId)) {
    req.requestId = incomingId;
  } else {
    req.requestId = crypto.randomUUID();
  }
  
  res.setHeader('X-Request-Id', req.requestId);
  next();
};
