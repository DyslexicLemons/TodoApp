const express = require("express");
const controller = require("../controllers/calendar.controller");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/status", asyncHandler(controller.getStatus));
router.get("/auth-url", asyncHandler(controller.getAuthUrl));
router.get("/oauth2callback", asyncHandler(controller.handleCallback));
router.post("/disconnect", asyncHandler(controller.disconnect));

module.exports = router;
