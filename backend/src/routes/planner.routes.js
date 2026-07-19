const express = require("express");
const controller = require("../controllers/planner.controller");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/week", asyncHandler(controller.getWeekPlan));

module.exports = router;
