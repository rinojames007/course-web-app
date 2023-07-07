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

const adminSchema = new mongoose.Schema ({
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
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);

// authentication middleware
const adminAuthentication = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, adminSecret, (err, user)=> {
            if(err) {
                res.sendStatus(403)
            }
            next();
        })
    } else {
        res.sendStatus(401);
    }
}

// admin routes
app.post('/admin/signup', async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username })
    if(admin){
        res.status(403).json({ message: 'user already exists'});
    } else {
        const newAdmin = new Admin({ username, password })
        await newAdmin.save()
        const token = jwt.sign({ username }, adminSecret, { expiresIn: '2h'});
        res.json({ message: "user created successfully", token })
    }
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const findAdmin = await Admin.findOne({ username, password });
    if(findAdmin) {
        const token = jwt.sign({ username }, adminSecret, { expiresIn: '2h'});
        res.json({ message: "user found successfully", token })
    } else {
        res.status(401).json({ message: "invalid credentials" });
    }
});

app.post('/admin/course/add', adminAuthentication, async(req, res) => {
    const { title, description, price, imageLink, published } = req.body;
    const newCourse = new Course({ title, description, price, imageLink, published });
    await newCourse.save()
    res.json({ message: "course added successfully" })
});

app.put('/admin/course/edit', adminAuthentication, async(req, res) => {
    const { title, description, price, imageLink, published, _id } = req.body;
    await Course.findOneAndUpdate({ _id: _id }, { title: title, description: description, price: price, imageLink: imageLink, published: published })
    res.json({ message: "course updated successfully" })
});

app.delete('/admin/course/edit', adminAuthentication, async (req, res) => {
    const { _id } = req.body;
    await Course.deleteOne({ _id: _id });
    res.json({ message: "course deleted successfully "})
})
// redundant

app.get('/admin/course/view', async (req, res) => {
    const course = await Course.find()
    res.json({ course })
})



// connecting to database
mongoose.connect(URI);
app.listen(port, () => {
    console.log("server listening on port 3000");
});