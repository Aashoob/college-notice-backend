const express = require("express");
const router = express.Router();
const { getNotices } = require("../controllers/noticeController");

router.get("/", getNotices);

module.exports = router;