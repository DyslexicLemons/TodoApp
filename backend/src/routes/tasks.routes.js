const express = require("express");
const controller = require("../controllers/tasks.controller");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/completed", asyncHandler(controller.listCompleted));
router.get("/suggestions", asyncHandler(controller.listSuggestions));
router.get("/", asyncHandler(controller.listByLength));
router.post("/", asyncHandler(controller.createTask));
router.get("/:id", asyncHandler(controller.getTaskDetail));
router.post("/:id/complete", asyncHandler(controller.completeTask));
router.patch("/:id", asyncHandler(controller.updateTask));
router.delete("/:id", asyncHandler(controller.deleteTask));

module.exports = router;
