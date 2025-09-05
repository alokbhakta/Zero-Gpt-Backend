const {Server} = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const aiService = require('../services/ai.service');
const messageModel = require('../models/message.model');
const {createMemory, queryMemory} = require('../services/vector.service');



function initSocketServer(httpServer){

    const io = new Server(httpServer, {
        cors: {
    origin: process.env.FRONTEND_URL, // allow everything
    allowedHeaders: ["Content-Type","Authorization"],
    credentials: true
  }
    })

    // Middleware in Socket.io for checking token in valid or not
    io.use(async (socket, next)=>{
        
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
        
        if(!cookies.token){
            next(new Error("Authantication error: No token provided"));
        }

        try{
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);
            socket.user = user;
            next();
        }
        catch(err){
            next(new Error("Authantication error: inValid token provided"))
        }

    })

    io.on("connection",(socket)=>{
        console.log("user Connected");
        // Ai-intigration in this
        socket.on("ai-message", async(messagePayload)=>{

            /*
            // Saving chat in MessageModel role user
            const message = await messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: messagePayload.content,
                role: "user"
            })

            // Saving data in the long term Memory Using Vectors
            const vectors = await aiService.generateVector(messagePayload.content);
            */

            // Combine Creating Message and converting into Vector Because it was Independent from each other
            const [message,vectors] = await Promise.all([
                messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: messagePayload.content,
                role: "user"
                }),
                aiService.generateVector(messagePayload.content)
            ])

            // Saving Vector in PineCone
            await createMemory({
                vectors,
                messageId: message._id,
                metadata: {
                    chat: messagePayload.chat,
                    text: messagePayload.content,
                    user: socket.user._id
                }
            })

            /*
            // Finding/Query Maching Vector in PineCone
            const memory = await queryMemory({
                queryVector: vectors,
                limit: 3,
                metadata: {}
            })

            console.log(memory);

            //Creating chat histroy of communication between user and Ai
            const chatHistory = (await messageModel.find({
                chat: messagePayload.chat
            }).sort({createdAt: -1}).limit(15).lean()).reverse();
            */

            // Combine MemoryQuery nad ChatHistory
            const [memory,chatHistoryRaw] = await Promise.all([
                queryMemory({
                queryVector: vectors,
                limit: 5,
                metadata: {
                    user: socket.user._id
                }
                }),
                messageModel.find({
                chat: messagePayload.chat
                }).sort({createdAt: -1}).limit(15).lean()
            ]);
            // Now reverse the array after awaiting
             const chatHistory = chatHistoryRaw.reverse();



            // Short Term Memory STM
            const stm = chatHistory.map(item =>{
                return{
                    role: item.role,
                    parts: [{text: item.content}]
                }
            })

            // Long Term Memory (LTM)
            const ltm = [
                {
                    role:"user",
                    parts: [{text: `
                        these are some previous messages from the chat, use them to generate a response
                        ${memory.map(item => item.metadata.text).join("\n")}
                        
                        `}]
                }
            ]

            console.log(ltm[0]);
            console.log(stm);
            
            //take Response from Ai
            const response = await aiService.generateResponse([...ltm,...stm]);

            // Giving Response to the user By Ai Model First
            socket.emit('ai-response',{
                content: response,
                chat: messagePayload.chat
            })

            /*
            //saved message by ai-model
            const responseMessage = await messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: response,
                role: "model"
            })

            // Saving Ai Response in Vector Database
            const responseVectors = await aiService.generateVector(response);
            */

            // Combine ResponseMessage and responseVectors
            const [responseMessage,responseVectors] = await Promise.all([
                messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: response,
                role: "model"
                }),
                aiService.generateVector(response)
            ])

            await createMemory({
                vectors: responseVectors,
                messageId: responseMessage._id,
                metadata: {
                    chat: messagePayload.chat,
                    text: response,
                    user: socket.user._id
                }
            })

            
        })

    })
}


module.exports = initSocketServer;

