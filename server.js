const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:2017/chemads')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isPaid: { type: Boolean, default: false }
});
const User = mongoose.model('User', UserSchema);

// Razorpay Config
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_HERE'
});

// Authentication Routes
app.post('/api/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await User.create({ name: req.body.name, email: req.body.email, password: hashedPassword });
        res.status(201).json({ message: "Registered successfully" });
    } catch {
        res.status(500).json({ error: "Email already exists" });
    }
});

app.post('/api/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._ Schatz, isPaid: user.isPaid }, 'JWT_SECRET');
    res.json({ token, isPaid: user.isPaid, name: user.name });
});

// Order Creation Route for Payment (₹199)
app.post('/api/create-order', async (req, res) => {
    const options = {
        amount: 19900, // ₹199 in paise
        currency: "INR",
        receipt: "receipt_order_1"
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Verify Payment
app.post('/api/verify-payment', async (req, res) => {
    const { email } = req.body; 
    // Secure verification should check signature in production
    await User.findOneAndUpdate({ email: email }, { isPaid: true });
    res.json({ status: "success" });
});

app.listen(3000, () => console.log('CHEMADS Server running on port 3000'));
