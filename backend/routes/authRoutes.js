const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const User = require(path.join(__dirname, "../models/User"));

const router = express.Router();


router.post("/signup", async (req, res) => {
    const { username, firstname, lastname, password } = req.body;

    try {
       
        if (!username?.trim() || !firstname?.trim() || !lastname?.trim() || !password?.trim()) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const trimmedUsername = username.trim().toLowerCase();

        
        const existingUser = await User.findOne({ username: trimmedUsername });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        
        const hashedPassword = await bcrypt.hash(password.trim(), 10);

        
        const newUser = new User({ 
            username: trimmedUsername, 
            firstname: firstname.trim(), 
            lastname: lastname.trim(), 
            password: hashedPassword 
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(500).json({ error: "Signup failed", details: error.message });
    }
});


router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        
        if (!username?.trim() || !password?.trim()) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const trimmedUsername = username.trim().toLowerCase();

       
        const user = await User.findOne({ username: trimmedUsername });
        if (!user) {
            console.error("Login Error: User not found");
            return res.status(400).json({ error: "Invalid username or password" });
        }

        
        const isMatch = await bcrypt.compare(password.trim(), user.password);
        if (!isMatch) {
            console.error("Login Error: Incorrect password");
            return res.status(400).json({ error: "Invalid username or password" });
        }

        
        if (!process.env.JWT_SECRET) {
            console.error("Server Error: JWT_SECRET is not defined in .env file");
            return res.status(500).json({ error: "Internal server error. Please try again later." });
        }

        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, username: user.username });

    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ error: "Login failed", details: error.message });
    }
});

module.exports = router;
