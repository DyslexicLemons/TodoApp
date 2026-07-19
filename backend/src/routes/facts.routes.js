const express = require("express");
const controller = require("../controllers/facts.controller");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/random", asyncHandler(controller.randomFact));

module.exports = router;
