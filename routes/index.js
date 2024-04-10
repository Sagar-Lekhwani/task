var express = require('express');
var router = express.Router();
var userModel = require('./users');
var passport = require('passport');
var localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const path = require("path");
const flash = require('express-flash');
const taskModel = require('./task');
const Excel = require('exceljs');



// creating middle ware functions here 
function IsLoggedIn (req, res, next){
  if (req.isAuthenticated()) {
    return next();
  }
  else{
    res.redirect('/login');
  }
}


/* GET home page. */
router.get('/', IsLoggedIn, function(req, res, next) {
  const successMessage = req.flash('success');
  res.render('index', { successMessage });
});



//All user Display
router.get('/user', IsLoggedIn , async function(req , res , next) {
  userModel.find({isAdmin : 'false'}).populate('tasks').then(function (users) {
    res.render('user' , {users})
  })
})  

// Adduser page Route 
router.get('/adduser' , IsLoggedIn , function(req , res , next) {
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  res.render('adduser' , {successMessage , errorMessage})
})

// Adduser  Route 
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/; // Assumes a 10-digit phone number

router.post('/adduser', IsLoggedIn, function(req, res, next) {
  const { name, email, number } = req.body;

  // Check if the email is valid
  if (!emailRegex.test(email)) {
    req.flash('error', 'Invalid email address');
    return res.redirect('/adduser');
  }

  // Check if the phone number is valid
  if (!phoneRegex.test(number)) {
    req.flash('error', 'Invalid phone number');
    return res.redirect('/adduser');
  }

  userModel.create({
    name: name,
    email: email,
    number: number,
  }).then(function(user) {
    req.flash('success', 'User created Successfully');
    res.redirect('/adduser');
  }).catch(function(err) {
    req.flash('error', 'Failed to create user');
    res.redirect('/adduser');
  });
});



// open addTask Page
router.get('/addtask' , IsLoggedIn , function(req , res , next) {
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  userModel.find({isAdmin : 'false'}).populate('tasks').then(function (users) {
    res.render('addtask' , {users , successMessage , errorMessage})
  })
})


// addTask Route
router.post('/addtask' , IsLoggedIn , function(req , res , next) {
  taskModel.create({
    name:req.body.name,
    status:req.body.type,
    userid:req.body.user,
  }).then(function(task) {
    userModel.findOne({_id:req.body.user}).then(function (user) {
      user.tasks.push(task._id)
      user.save().then(function () {
        req.flash('success' , 'Task created Successfully')
        res.redirect('/addtask');
      })
    })
  })
})

router.get('/alltasks' , IsLoggedIn , function(req , res , next) {
  taskModel.find().populate('userid').then(function (alltasks) {
    res.render('task' , {alltasks})
  })
})

// export page
router.get('/export' , IsLoggedIn , function(req , res , next) {
  taskModel.find().populate('userid').then(function (alltasks) {
    userModel.find({isAdmin : 'false'}).populate('tasks').then(function (users) {
      res.render('export' , {users , alltasks})
    })
  })
})

// view user
router.get('/viewuser/:id' , IsLoggedIn , function(req , res , next) {
  userModel.findOne({_id:req.params.id}).populate('tasks').then(function(user) {
    res.render('viewuser' , {user})
  })
})

// get login page 
router.get('/login', function(req, res, next) {
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  res.render('login' , {successMessage , errorMessage});
});

// get logged in 
router.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Invalid username or password',
  successRedirect: '/',
  successFlash: 'Logged in successfully'
}));

// create Default Admin 
// router.get('/createAdmin', function(req, res, next) {
//   var Admin = new userModel ({
//     username:'Admin',
//     name:'Admin',
//     isAdmin:true,
//     email:'sgrlejwani@gmail.com',
//     number:'7477032265',
//   })
//   userModel.register(Admin,'Admin')
//   .then(function (user) {
//     res.json({sucess:'login' , user});
//   })
// });


// export data to excel
router.get('/exportdata', async function (req, res) {
  try {
    // Get tasks and users based on a specific criteria
    const tasks = await taskModel.find().populate('userid');
    const users = await userModel.find({isAdmin:'false'});

    // Creating a new Excel workbook
    const workbook = new Excel.Workbook();
    const taskWorksheet = workbook.addWorksheet('Tasks');
    const userWorksheet = workbook.addWorksheet('Users');

    // Add headers
    taskWorksheet.addRow(['Task id', 'Task Name', 'Allotted To' , 'Task Status']);
    userWorksheet.addRow(['user ID' , 'Name', 'Email', 'Number' , 'task alloted' ]);

    // Add data rows for tasks
    tasks.forEach(task => {
      taskWorksheet.addRow([task._id , task.name , task.userid.name , task.status]);
    });

    // Add data rows for users
    users.forEach(user => {
      userWorksheet.addRow([user._id, user.name, user.email, user.number , user.tasks.length]);
    });

    // Set response headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment: filename=task_user_export.xlsx');

    // Write the Excel file to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting tasks and users:', err);
    res.status(500).send('Failed to export tasks and users');
  }
});


//logout 

router.get('/logout', function(req, res, next) {
  if (req.isAuthenticated()) {
    req.logout(function(err) {
      if (err) {
        req.flash('error', 'Failed to log out');
        res.redirect('/login');
      } else {
        req.flash('success', 'Logged out successfully');
        res.redirect('/login');
      }
    });
  } else {
    req.flash('error', 'You are not logged in');
    res.redirect('/login');
  }
});


module.exports = router;

