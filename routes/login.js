"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Simple hardcoded user for demonstration
const USER = {
    username: 'admin',
    password: 'password123',
};
router.post('/', (req, res) => {
    const { username, password } = req.body;
    if (username === USER.username && password === USER.password) {
        return res.json({ success: true, message: 'Login successful!' });
    }
    else {
        return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
});
exports.default = router;
