const chatModel = require('../models/chat.model');


async function createChat(req, res){
    const {title} = req.body;
    const user = req.user;

    const chat = await chatModel.create({
        user: user._id,
        title
    });

    res.status(201).json({
        message: "Chat Created Successfully",
        chat:{
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity
        }
    })

}


async function getChats(req, res) {
    console.log('get chat call3ed');
    
  try {
    const userId = req.params.id;
    console.log(userId);

    

    const AllChat = await chatModel.find({ user: userId });

    res.status(200).json({
      message: "Chats loaded Successfully",
      AllChat,
    });
  } catch (err) {
    console.error(err); // Log full error
    res.status(500).json({ message: "Server error", error: err.message });
  }
}



module.exports = {createChat,getChats}

