const express = require("express");
const router = express.Router();
const { getMessages, createMessage } = require("../controllers/message.controller");

// GET all messages for a chat
router.get("/:chatId", getMessages);

// POST a new message in chat
router.post("/:chatId", createMessage);

module.exports = router;
