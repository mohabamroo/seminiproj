var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var fs = require('fs');
var path = require("path");
var userUploadsPath = path.resolve(__dirname, "user_uploads");


var multer  = require('multer');
var storagetype = "screenshot";
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public/user_uploads');
  },
  filename: function (req, file, callback) {
  	console.log(file.originalname);
  	console.log
  	var filename = file.originalname;
  	var arr = filename.split(".");
  	var filetype = arr[arr.length-1];
  	var newfilename = req.user.username + '-' + Date.now()+'.'+filetype;
    callback(null, newfilename);
    console.log(req.body.photoName);
    var str;
    if(storagetype=="screenshot")
    	str = req.body.photoName.toString();
    if(str==null || str=="")
    	str = filename;
    console.log(str);
    var newphoto = {'name': str, 'src': newfilename};

    User.getUserbyUsername(req.user.username, function(err, user) {
    	if(storagetype=="screenshot") {
			var oldphotos = user.photos;
			oldphotos.push(newphoto);
			User.update({_id:req.user.id}, {$set:{photos:oldphotos}}, function(err, res) {
				if(err)
					console.log(err);
			});
    	} else {
    		if(storagetype=="profilephoto") {
    			var oldphotos = user.photos;
				oldphotos.push(newphoto);
				User.update({_id:req.user.id}, {$set:{profilephoto: newfilename}}, function(err, res) {
				if(err)
					console.log(err);
				});
    		}
    	}
		
	});
  }
});
var upload = multer({ storage : storage}).single('userPhoto');

var User = require('../models/user');
//router.use(bodyParser);
router.get("/signup", function(req, res) {
	res.locals.pagetitle = 'Sign Up';
	res.render('sign_up.html');
});

router.get("/signin", function(req, res) {
	res.locals.pagetitle = 'Sign in';
	res.render('sign_in.html');
});

router.post("/signup", function(req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
	var confirmpassword = req.body.confirmpassword;
	var username = req.body.username;
	var type = req.body.type;
	console.log(type);
	req.checkBody('name', 'Name is empty!').notEmpty();
	req.checkBody('email', 'Email is empty!').notEmpty();
	req.checkBody('password', 'Password is empty!').notEmpty();
	req.checkBody('username', 'Username is empty!').notEmpty();
	req.checkBody('type', 'Type is not chosen!').notEmpty();
	if(password != null && confirmpassword != null) {
		req.checkBody('confirmpassword', 'Passwords do not match!').equals(req.body.password);
	}
	errors = req.validationErrors();

	if(errors) {
		errors.forEach(function(error) {
			console.log(error.msg);
		});
		res.render('sign_up.html', {
			errors: errors
		});
	} else {
		var newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password,
			usertype: type,
			links: [],
			summary: ""
		});

		User.createUser(newUser, function(err, user){
			if(err) throw err;
			console.log(user);
		});	
	}
	res.locals.pagetitle = 'Sign In',
	res.redirect('/users/signin');
	
});

router.post('/profile/:id',  function(req, res) {
	if(req.isAuthenticated() && req.user.id == req.params.id) {
		res.render('profile.html');
	} else {
		req.flash('error_msg','You are not logged in');
		res.redirect('/users/signin');
	}
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserbyUsername(username, function(err, user) {
   		if(err)
   			throw err;
   		if(!user) {
   			return done(null, false, {message: 'Unknown User'});
   		}

   	User.validatePassword(password, user.password, function(err, res){
   		if(err)
   			throw err;
   		if(res==true){
   			return done(null, user);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
  }));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/signin',
  passport.authenticate('local', {
  	successRedirect: '/',
    failureRedirect: '/users/signin' }),
  function(req, res) {
    res.redirect('/');
  });

router.get('/signout', function(req, res){
	if(req.isAuthenticated()){
		req.logout();
	} else {
		//req.flash('error_msg','You are not logged in');
	}

	req.flash('success_msg', 'You are signed out');

	res.redirect('/users/signin');
});



router.post('/addlink', function(req, res) {
	var newlink = req.body.newlink;
	User.getUserbyUsername(res.locals.user.username, function(err, user) {
		var oldlinks = user.links;
		oldlinks.push(newlink);
		User.update({_id:res.locals.user.id}, {$set:{links:oldlinks}}, function(err, res) {
		if(err)
			console.log(err);
		});
	});
	res.redirect('/users/profile/'+req.user.id);
	
	res.send(res.locals.user.username);
});

router.post('/addscreenshot',function(req,res) {
	storagetype = "screenshot";
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.\n"+err);
        }
        res.redirect('/users/profile/'+req.user.id);
    });
});

router.post('/search', function(req, res) {
	// res.send(req.body.searchusername);
	User.getUserbyUsername(req.body.searchusername, function(err, user) {
		if(err)
			console.log('err: '+err);
		else {
			console.log(req.url);
			//req.url = req.headers.host;
			console.log(req.url);
			res.render('searchresults.html', {
				'usersearchedfor': user
			});
		}
			

	});
});

router.get('/viewprofile/:id',function(req,res){
	User.getUserById(req.params.id, function(err, resuser) {
		if(err)
			console.log(err);
		else
			res.render('viewprofile.html', {
	    		dude : resuser
	    	});	
	});
    
});


router.post('/updateSummary', function(req, res) {
	console.log(req.body.userDesc);
	User.update({_id:req.user.id}, {$set:{summary:req.body.userDesc}}, function(err, res) {
		if(err)
			console.log(err);
	});
	res.redirect('/users/profile/'+req.user.id);
});

router.post('/updateProfilePhoto', function(req, res) {
	storagetype = "profilephoto";
	upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.\n"+err);
        }
        res.redirect('/users/profile/'+req.user.id);
    });
});
module.exports = router;