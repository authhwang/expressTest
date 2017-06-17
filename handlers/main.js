var randomFortune = require('../lib/fortune.js').getRandomFortunes;


exports.home = function(req,res){
    res.render('home');
};

exports.about = function(req,res){
    res.render('about',{fortune: randomFortune(),
                        pageTestScript: '/qa/tests-about.js'
    });
};

exports.newsletter = function(req,res){
     res.render('newsletter',{csrf : 'CSRF token goes here'});    
}


var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;


function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
	cb();
};

exports.newsletterProcessPost = function(req,res){
    var name = req.body.name || '';
    var email = req.body.email || '';

    if(!email.match(VALID_EMAIL_REGEX)) {
        if(req.xhr) return res.json({error: 'Invalid name email address.'});
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was not valid.',
        };
        return res.redirect(303,'/newsletter/archive');
    }

    new NewsletterSignup({name: name,email: email}).save(function(err){
        if(err){
            if(req.xhr) return res.json({error: 'Database error.'});
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error;please tyy again later.',
            };
            return res.redirect(303,'/newsletter/archive');
        }
        if(req.xhr) return res.json({success: true});
        req.session.flash = {
            type: 'success',
            intro: 'thank you !',
            message: 'You have now been signed up for the newsletter.',
        };
        return res.redirect(303,'/newsletter/archive');
    });
}

exports.newlettersArchive = function(req,res){
        res.render('newsletter/archive');
}

exports.thankyou = function(req,res){
    res.render('thank-you');
}