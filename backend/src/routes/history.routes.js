const express = require("express");
const controller = require("../controllers/history.controller");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/months", asyncHandler(controller.listMonths));
router.get("/monthly", asyncHandler(controller.getMonthly));
router.get("/weekday-matrix", asyncHandler(controller.getWeekdayMatrix));

module.exports = router;
