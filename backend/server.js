const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config(); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());


if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI is not defined in .env file.");
    process.exit(1);
}


connectDB().catch(err => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
});


const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);


const GroupMessage = require("./models/GroupMessage");

io.on("connection", (socket) => {
    console.log(`New user connected: ${socket.id}`);

    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on("chatMessage", async (data) => {
        try {
            const { from_user, room, message } = data;
            if (!from_user || !room || !message) {
                console.error("Invalid message data:", data);
                return;
            }

            const newMessage = new GroupMessage({ from_user, room, message });
            await newMessage.save();
            io.to(room).emit("message", data);
            console.log(`Message sent to ${room}: ${message}`);
        } catch (error) {
            console.error("Error saving message:", error.message);
        }
    });

    socket.on("typing", (room) => {
        socket.to(room).emit("typing", "User is typing...");
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
