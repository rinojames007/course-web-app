const express = require('express');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const port = 3000;


// middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

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
};

const userAuthentication = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader){
        const token = authHeader.split(' ')[1];
        jwt.verify(token, userSecret, (err, user) => {
            if(err) {
                res.sendStatus(403)
            }
            req.user = user;
            next();
        })
    } else {
        res.sendStatus(401);
    }
}

app.get('/test', (req, res) => {
    res.json({ message: "connected with backend" });
})

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

app.put('/admin/course/:courseId', adminAuthentication, async(req, res) => {
    const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true });
    if(course) {
        res.json({ message: "course updated successfully" })
    } else {
        res.status(404).json({ message: "course not found"})
    }
});

app.delete('/admin/course/edit', adminAuthentication, async (req, res) => {
    const { _id } = req.body;
    await Course.deleteOne({ _id: _id });
    res.json({ message: "course deleted successfully "})
})

// redundant
// app.get('/admin/course/view', async (req, res) => {
//     const course = await Course.find()
//     res.json({ course })
// })

// user routes
app.post('/user/signup', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(user) {
        res.status(403).json({ message: "user already exists"})
    } else {
        const newUser = new User({ username, password })
        await newUser.save();
        const token = jwt.sign({ username }, userSecret, { expiresIn: '1h' })
        res.json({ message: "user created successfully", token});
    }
});

app.post('/user/login', async (req, res) => {
  const { username, password } = req.body;
  const findUser = await User.findOne({ username, password });
  if(findUser){
      const token = jwt.sign({ username }, userSecret, { expiresIn: '1h'});
      res.json({ message: "logged in successfully", token })
  } else {
      res.status(403).json({ message: "invalid credentials", token })
  }
});

app.get('/user/course', userAuthentication, async (req, res) => {
    const allCourses = await Course.find({ published: true });
    res.json({ allCourses });
})

app.post('/user/course/:courseId', userAuthentication, async (req, res) => {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);
    if(course) {
        const user = await User.findOne({ username: req.user.username });
        if(user) {
            user.purchasedCourses.push(course);
            await user.save();
            res.json({ message: "course purchased successfully" });
        } else {
            res.status(404).json({ message: "user not found"})
        }
    } else {
        res.status(404).json({ message: "course not found" })
    }
})

app.get('/user/course/purchased', userAuthentication, async (req, res) => {
    const user = await User.findOne({ username: req.user.username }).populate('purchasedCourses');
    if(user){
        res.json({ purchasedCourses: user.purchasedCourses || [] });
    } else {
        res.status(403).json({ message: "user not found" });
    }
});

// connecting to database
mongoose.connect(URI);
app.listen(port, () => {
    console.log("server listening on port 3000");
});