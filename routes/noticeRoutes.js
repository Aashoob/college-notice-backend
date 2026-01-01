const express = require("express");
const router = express.Router();
const { getNotices, createNotice } = require("../controllers/noticeController");

// GET /api/notices
router.get("/", getNotices);

// POST /api/notices
router.post("/", createNotice);

module.exports = router;