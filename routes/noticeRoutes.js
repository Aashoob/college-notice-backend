const express = require("express");
const router = express.Router();
const { getNotices } = require("../controllers/noticeController");

router.get("notices/", getNotices);

module.exports = router;