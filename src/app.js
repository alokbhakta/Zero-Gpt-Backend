const express = require('express');
const cookieParser = require('cookie-parser');
var cors = require('cors');

// routes path
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const messageRoutes = require('./routes/message.routes');
const res = require('express/lib/response');
const morgan = require('morgan');


const app = express();
// using middelwares
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'))

const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || '').replace(/\/$/, ''); // strip trailing slash

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow non-browser clients
    const normalized = origin.replace(/\/$/, '');
    if (normalized === FRONTEND_ORIGIN) {
      return cb(null, true);
    }
    return cb(new Error(`CORS blocked for origin ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.set('trust proxy', 1);

// app.use(cors({
//     origin: process.env.FRONTEND_URL, // your frontend URL
//     credentials: true,               // allow cookies
//   }));


// Health check route
app.get("/", (req, res) => {
  res.json({ message: "✅ Backend server is running!" });
});

app.get('/health',(req,res)=> {
  res.json({
    message: 'Server is running properly'
  })
})
// using Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat',chatRoutes);
app.use("/api/message", messageRoutes);

module.exports = app;