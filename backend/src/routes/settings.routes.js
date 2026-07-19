const express = require("express");
const controller = require("../controllers/settings.controller");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(controller.getSettings));
router.put("/", asyncHandler(controller.updateSettings));

module.exports = router;
