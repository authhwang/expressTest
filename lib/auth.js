var User = require('../model/user.js'),
    passport = require('passport'),
    localStrategy = require('passport-local').Strategy,
    weiboStrategy = require('passport-weibo').Strategy,
    oauth2Strategy = require('passport-oauth').OAuth2Strategy;


passport.serializeUser(function(user,done){
    done(null,true);
});

passport.deserializeUser(function(user,done){
    // User.findById(id,function(err,user){
    //     if(err || !user) return done(err,null);
    //     done(null,user);
    // })
    done(null,true);
});


module.exports = function(app,options){

    if(options.provider)
        var provider = options.provider;

    if(!options.successRedirect)
        options.successRedirect = '/account';
    if(!options.failRedirect)
        options.failRedirect = '/login';
    
    return {
        init: function(){
            passport.use(new localStrategy(function(username,password,done){
               User.findOne({name: username},function(err,user){
                    if(err) return done(err,null);
                    if(!user) return done(null,false,{message: 'Incorrect username'});
                    if (user.password != password) return done(null,false,{message: 'Incorrect password'});
                    return done(null,user);
               }); 
            }));

            app.use(passport.initialize());
            app.use(passport.session());
        },
        weiboInit: function(){
            passport.use(new oauth2Strategy({
                authorizationURL: 'https://api.weibo.com/oauth2/authorize',
                tokenURL: 'https://api.weibo.com/oauth2/access_token',
                clientID: provider.appkey,
                clientSecret: provider.appSecret,
                callbackURL: "https://127.0.0.1:3000/auth/weibo/callback",
            },function(accessToken,refreshToken,profile,done){
                console.log(accessToken);
                console.log(refreshToken);
                console.log(profile);
                done(null,profile);
            }));

            app.use(passport.initialize());
            app.use(passport.session());

        },
        registerRoutes: function(){
            app.get('/login',function(req,res){
                res.render('login');
            });

            app.post('/login',passport.authenticate('local',{successRedirect: '/',
                                                            failRedirect: '/login', 
                                                        }));
                                                        
            app.get('/auth/weibo',passport.authenticate('oauth2',{scope: 'email'}));

            app.get('/auth/weibo/callback',passport.authenticate('oauth2',{successRedirect: '/',
                                                                             failRedirect: '/login', 
                                                         }));
        },
    }

}