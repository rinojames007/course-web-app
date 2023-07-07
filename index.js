const express = require('express');
require('dotenv').config()

const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const port = 3000;

// middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())

// secrets and connection uri
const URI = process.env.connectionStr;
const adminSecret = process.env.adminSecret;
const userSecret = process.env.userSecret;

const token = jwt.sign({}, process.env.userSecret);

// schemas 
const userSchema = new mongoose.Schema ({
    username: String,
    password: String,
    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
    //referencing to the course table
});

const adminsSchema = new mongoose.Schema ({
    username: String,
    password: String
});

const courseSchema = new mongoose.Schema ({
    title: String,
    description: String,
    price: Number,
    imageLink: String,
    published: Boolean
});

// models
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminsSchema);
const Course = mongoose.model('Course', courseSchema);

app.post('/', (req, res) => {
    const { username, password } = req.body;
    const obj = {
        username: username,
        password: password
    }
    const token = jwt.sign({ username: username }, adminSecret);
    const og = jwt.verify(token, adminSecret);
    res.json(og);
})

mongoose.connect(URI);
app.listen(port, () => {
    console.log("server listening on port 3000");
});