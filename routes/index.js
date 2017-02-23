var express = require('express');
var router = express.Router();
var User = require('../models/user');


router.get('/', function(req, ress) {
	console.log(req.success_msg);
	var people = [];
	User.find(function(err, res) {
		res.forEach(function(person) {
			var str = person.name.toString();
			var pstr;
			if(person.profilephoto)
				pstr = person.profilephoto.toString();			
			console.log(pstr);

			if(person.usertype=="developer") {
				console.log(str+'/'+person.usertype);
				people.push({name: str, id: person.id, photo: pstr});
			}
		});
		ress.render('index.html', {
			people: people
		});
	});
	
});

function ensureAuthenticated(req, res, next){
	// if(req.isAuthenticated()){
	// 	return next();
	// } else {
	// 	//req.flash('error_msg','You are not logged in');
	// 	res.redirect('/users/signin');
	// }
	return next();
}

module.exports = router;