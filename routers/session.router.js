const express = require("express");
const router = express.Router();
const controller = require("../controllers/session.controller");

// Routes
router.get("/", controller.getAllSessions);
router.get("/:id", controller.getSessionById);
router.post("/", controller.createSession);
router.put("/:id/complete", controller.makeSessionComplete);
router.put("/:id", controller.updateSession);
router.delete("/:id", controller.deleteSession);

module.exports = router;
