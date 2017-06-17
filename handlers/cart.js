var Vacation = require('../model/vacation.js'),
    Q = require('q'),
    emailService = require('../lib/email.js')(require('../credentials.js'));

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

exports.middleware = function(req,res,next){
    var cart = req.session.cart;
    if(!cart || !cart.items) return next();
    req.cart = {
        items: cart.items.map(function(item){
            return {
                guests: item.guests,
                sku: item.sku,
            };
        })
    };

    var promises = req.cart.items.map(function(item){
        return Q.promise(function(reslove,reject){
            Vacation.findOne({sku: item.sku},function(err,vacation){
                if(err) return reject(err);
                item.vacation = vacation;
                resolve();
            })
        })
    });

    Q.all(promises)
        .then(function(){
            next();
        })
        .catch(function(){
            next(err);
        })
};

function addToCart(sku,guests = 1,req,rex,next){
    var cart = req.session.cart || (req.session.cart = {item: []});
    Vacation.findOne({sku: sku},function(err,vacation){
        if(err) return next(err);
        if(!vacation) return next(new Error('Unknown vcation SKU: '+ sku));
        cart.items.push({
            sku: sku,
            guests: guests,
        });
    });

    res.redirect(303,'/cart');
}

exports.addProcessGet = function(req,res,next){
    addToCart(req.query.sku,req.query.guests,req,res,next);
}

exports.addProcessPost = function(req,res,next){
    addToCart(req.body.sku,req.body.guests,req,res,next);
}

exports.home = function(req,res,next){
    res.render('cart',{cart:req.session.cart});
}

exports.checkout = function(req,res,next){
    var cart = req.session.cart;
    if(!cart) next();
    res.render('cart-checkout');
}

exports.thankyou = function(req,res){
    res.render('cart-thank-you',{cart: req.session.cart});
}

exports.emailThankYou = function(req,res){
    res.render('email/cart-thank-you',{cart: req.session.cart,layout:null});
}

exports.checkoutProcessPost = function(req,res){
    var cart = req.session.cart;
    if(!cart) next(new Error('Cart does not exist.'));
    var name = req.body.name || '',
    email = req.body.email || '';

    if(!email.match(VALID_EMAIL_REGEX)) return res.next(new Error('Invaild email address'));
    
    cart.number = Math.random().toString().replace(/^0\.0*/,'');
    cart.billing = {
        name: name,
        email: email,
    };

    res.render('email/cart-thank-you',{layout: null,cart:cart},function(err,html){
        if(err) console.error('error in email templates: ' + err.stack);
        emailService.send(cart.billing.email,'Thank you for booking your trip with Meadowlark Travel!',html);
    });
};

exports.setCurrency = function(req,res){
    req.session.currency = req.params.currency;
    return res.redirect(303,'/vacations');
}