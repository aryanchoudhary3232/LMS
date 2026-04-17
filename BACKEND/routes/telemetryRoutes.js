const express = require("express");
const { recordFrontendMetrics } = require("../config/metrics");

const router = express.Router();

router.post("/rum", (req, res) => {
  const payload = req.body || {};
  const metrics = Array.isArray(payload.metrics) ? payload.metrics : [];

  const summary = recordFrontendMetrics(metrics);

  return res.status(202).json({
    success: true,
    received: metrics.length,
    accepted: summary.accepted,
    rejected: summary.rejected,
  });
});

module.exports = router;
