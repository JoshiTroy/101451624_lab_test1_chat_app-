const express = require("express");
const GroupMessage = require("../models/GroupMessage");
const PrivateMessage = require("../models/PrivateMessage");

const router = express.Router();


router.get("/group/:room", async (req, res) => {
    const { room } = req.params;
    const messages = await GroupMessage.find({ room });
    res.json(messages);
});


router.get("/private/:from/:to", async (req, res) => {
    const { from, to } = req.params;
    const messages = await PrivateMessage.find({
        $or: [{ from_user: from, to_user: to }, { from_user: to, to_user: from }]
    });
    res.json(messages);
});

module.exports = router;
