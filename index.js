const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes')
const app = express();
const Habit = require('./model/habitModel'); 
const User = require('./model/userModel');
const http = require('http'); // Required for Socket.IO
const { Server } = require('socket.io'); // Socket.IO server
const agenda = require('./agendaConfig');
const path = require("path");
const port = 3000;

dotenv.config();
app.use(cors());
app.use(express.json());
const server = http.createServer(app); // Create HTTP server for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this based on your frontend URL for security
    methods: ["GET", "POST"],
  },
});


app.use('/api/auth', authRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const con_string = process.env.CONNECTION_STRING

mongoose.connect(con_string).then(()=>{
    console.log('mongoDB connected successfully');
}).catch((err)=>{
    console.log('mongoDB connection failed due to : ',err);
})


let users = {};

// Socket.IO Connection Handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user with their userId
  socket.on("register", (userId) => {
    users[userId] = socket.id;
    console.log(`✅ User ${userId} registered with socket ID ${socket.id}`);
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(users).find((key) => users[key] === socket.id);
    if (userId) {
      delete users[userId];
      console.log(`❌ User ${userId} disconnected`);
    }
  });
});

// Function to send notifications via Socket.IO
const sendNotification = (userId, message) => {
  if (!users[userId]) {
    console.log(`❌ User ${userId} is not connected`);
    return;
  }

  const socketId = users[userId];
  io.to(socketId).emit("notification", message);
  console.log(`✅ Sent notification to ${userId}: ${message}`);
};

// Define Agenda job for sending reminders
agenda.define('send habit reminder', async (job) => {
  const { userId, habitName } = job.attrs.data;
  const message = `Reminder: It's time for your habit - ${habitName}`;
  sendNotification(userId, message);
});

(async function () {
  await agenda.start();
  // console.log('Agenda scheduler started. Agenda instance:', agenda);
})();

module.exports = { sendNotification, io };

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
