const express = require('express');
require('dotenv').config()

const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const port = 3000;
app.use(bodyParser.urlencoded({ extended: false }));

// secrets and connection uri
const uri = process.env.connectionStr;
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

mongoose.connect(`mongodb+srv://rinojames007:jamesrino@rinojames007.qxqdx3e.mongodb.net/?retryWrites=true&w=majority`);

app.listen(3000, () => {
    console.log("server listening on port 3000");
})