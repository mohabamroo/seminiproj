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
			User.update({_id:req.user.id}, {$set:{photos:oldphotos, portifolio: "true"}}, function(err, res) {
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
var Tag = require('../models/tag');

//router.use(bodyParser);
function ensureAuthenticated(req, res, next){	
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','You are not logged in');
		res.redirect('/users/signin');
	}
}
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
	var gucid = req.body.gucid;
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
			summary: "no summary", 
			phone: "no phone",
			tags: [],
			profilephoto: "default-photo.jpeg",
			gucid: gucid
		});

		User.createUser(newUser, function(err, user) {
			if(err) {
				console.log(err);
				//throw err;
				req.flash('error_msg', 'Duplicate Username!');
				res.redirect('/users/signup');
				return;
			} else {
				console.log(user);
				res.locals.pagetitle = 'Sign In';
				req.flash('success_msg','You signed up successfully!');
				res.redirect('/users/signin');	
			}
		});	
	}
	
	
});

router.get('/profile/:id', ensureAuthenticated, function(req, res) {
	if(req.isAuthenticated() && req.user.id == req.params.id) {
		res.render('profile.html');
	} else {
		req.flash('error_msg','You are not logged in');
		res.redirect('/users/signin');
	}

});

router.get('/makeportifolio/:id',  function(req, res) {
	if(req.isAuthenticated() && req.user.id == req.params.id) {
		res.render('makeportifolio.html');
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
	// important callback
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
	if(req.body.reponame!="" && req.body.url!="") {
		var newlink = {name: req.body.reponame, url: req.body.newlink};
		User.getUserbyUsername(res.locals.user.username, function(err, user) {
			var oldlinks = user.links;
			oldlinks.push(newlink);
			User.update({_id:res.locals.user.id}, {$set:{links:oldlinks, portifolio: "true"}}, function(err, res) {
			if(err)
				console.log(err);
			});
		});	
	} else {
		req.flash("error_msg", "Fill all the fields!")
	}
	res.redirect('/users/profile/'+req.user.id);
});

router.post('/addTags', function(req, res) {
	if(req.body.tags!="") {
		var tagsStr = req.body.tags;
		var tagsArr = tagsStr.split(', ');
		User.getUserbyUsername(res.locals.user.username, function(err, user) {
			var oldTags = user.tags;
			tagsArr.forEach(function(tag) {
				User.update({_id:res.locals.user.id}, {$push: {tags: tag}}, function(err1, ress) {
					if(err)
						console.log(err1);
				});
				var userToAdd = {name: user.username, profileid: user.id, photo: user.profilephoto};
				Tag.getTagbyTagname(tag, function(err2, tagres) {
					if(tagres!=null) {
						Tag.update({_id: tagres.id}, {$push: {users: userToAdd}}, function(errpush, pushRes) {
							if(errpush)
								throw errpush;
						});
					} else {
						var newTag = new Tag({tag: tag, users: [userToAdd]});
						Tag.createTag(newTag, function(err3, resnewtag) {
							if(err3)
								throw err3;
							else
								console.log(resnewtag);
						});
					}
				});
			});
			
		});	
	} else {
		// req.flash("error_msg", "Fill all the fields!")
	}
	res.redirect('/users/profile/'+req.user.id);	
});

router.post('/deletelink/:link', function(req, res) {
	var url = req.params.link;
	User.update({_id: req.user.id},
		{$pull: {
		   		'links': {url: url}
		   	}}, function(err, pullRes) {
		   		if(err) {
			  		console.log("Error:\n" + err);
			  		throw err;
			  	} else {
			  		console.log("Deleted link!\n" + JSON.stringify(pullRes));
			  	}
	});
	res.redirect('/users/profile/'+req.user.id);	
});

router.post('/deletescreenshot/:screenshot', function(req, res) {
	var url = req.params.screenshot;
	User.update({_id: req.user.id},
		{$pull: {
		   		'photos': {src: url}
		   	}}, function(err, pullRes) {
		   		if(err) {
			  		console.log("Error:\n" + err);
			  		throw err;
			  	} else {
			  		console.log("Deleted screenshot!\n" + JSON.stringify(pullRes));
			  	}
	});
	res.redirect('/users/profile/'+req.user.id);	
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
	var searchterm = req.body.searchusername;
	search(req, res, searchterm);
	
});

router.get('/searchShort/:searchterm', function(req, res) {
	search(req, res, req.params.searchterm);
});

function search(req, res, searchterm) {
	var usersFound = [];
	User.getUserbyUsername(searchterm, function(err, user) {
		if(err)
			console.log('err: '+err);
		else {
			if(user!=null)
				usersFound.push(user);
			Tag.getTagbyTagname(searchterm, function(err, tagres) {
				if(err)
					throw err;
				else {
					if(tagres!=null) {
						var counter = tagres.users.length;
						if(counter>0)
							tagres.users.forEach(function(userintaglist) {
								User.getUserById(userintaglist.profileid, function(err2, userobj) {
									if(err2)
										throw err2;
									else
										if(userobj!=null) {
											console.log("java:\n"+userobj);
											usersFound.push(userobj);	
										}
										counter--;
										console.log(counter)
										if(counter==0) {
											res.render('searchresults.html', {
														'users': usersFound
											});
										}
								});
							});
						else {
							res.render('searchresults.html', {
								'users': usersFound
							});
						}
					} else {
						res.render('searchresults.html', {
							'users': usersFound
						});
					}	
				}
			});
		}
	});
}

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

router.post('/updateEmail', function(req, res) {
	User.update({_id:req.user.id}, {$set:{email:req.body.email}}, function(err, ress) {
		if(err) {
			console.log(err);
			throw err;
		} else {
			console.log("email update: " + JSON.stringify(ress));
		}
	});
	res.redirect('/users/profile/'+req.user.id);

});

router.post('/updatePhone', function(req, res) {
	User.update({_id:req.user.id}, {$set:{phone:req.body.phone}}, function(err, ress) {
		if(err) {
			console.log(err);
			throw err;
		} else {
			console.log("phone update: " + JSON.stringify(ress));
		}
	});
	res.redirect('/users/profile/'+req.user.id);

});

router.post('/updateSummary', function(req, res) {
	console.log(req.body.userDesc);
	User.update({_id:req.user.id}, {$set:{summary:req.body.userDesc}}, function(err, ress) {
		if(err) {
			console.log(err);
			throw err;
		} else {
			console.log("summary update: " + JSON.stringify(ress));
		}
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