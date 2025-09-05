const messageModel = require("../models/message.model");

// Get all messages by chatId
async function getMessages(req, res) {
  try {
    const { chatId } = req.params;
    if(!chatId) {
      return res.status(404).json({
        message: "Please Select Chat Or Create New Chat"
      })
      
    }

    const messages = await messageModel
      .find({ chat: chatId })
      .populate("user", "name email") // populate user details if needed
      .sort({ createdAt: 1 }); // oldest → newest

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Create a new message
async function createMessage(req, res) {
  try {
    const { chatId } = req.params;
    const { user, content, role } = req.body;

    const newMessage = new messageModel({
      user,
      chat: chatId,
      content,
      role,
    });

    await newMessage.save();

    return res.status(201).json(newMessage);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getMessages, createMessage };
