const express = require('express');
const cookieParser = require('cookie-parser');
var cors = require('cors');

// routes path
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const messageRoutes = require('./routes/message.routes')


const app = express();
// using middelwares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL, // your frontend URL
    credentials: true,               // allow cookies
  }));

// using Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat',chatRoutes);
app.use("/api/message", messageRoutes);

module.exports = app;