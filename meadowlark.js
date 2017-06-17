var express = require('express');
var https = require('https');
var fs = require('fs');
var User = require('./model/user.js');
var mongoose = require('mongoose');
var Vacation = require('./model/vacation.js');
var MongoSessionStore = require('session-mongoose')(require('connect'));
var sessionStore = new MongoSessionStore({url:'mongodb://localhost/meadowlark'});
var formidable = require('formidable');
var credentials = require('./credentials.js');
var jqupload = require('jquery-file-upload-middleware');
var emailService = require('./lib/email.js')(credentials);
var cartValidation = require('./lib/cartValidation.js');
var handlebars = require('express-handlebars')
            .create(
                {defaultLayout : 'main',
                 helpers : {
                    section : function(name,options){
                        if(!this._sections) this._sections = {};
                        this._sections[name] = options.fn(this);
                        return null;
                    },
                    static: function(name){
                        return require('./lib/static.js').map(name);
                    }
                }
        });


mongoose.connect('mongodb://localhost/meadowlark');

Vacation.find(function(err,vacations) {

    if(vacations.length) return;

    new Vacation({
    name: 'Hood River Day Trip',
    slug: 'hood-river-day-trip',
    category: 'Day Trip',
    sku: 'HR199',
    description: 'Spend a day sailing on the Columbia and ' +
      'enjoying craft beers in Hood River!',
    priceInCents: 9995,
    tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
    inSeason: true,
    maximumGuests: 16,
    available: true,
    packagesSold: 0,
  }).save();

  new Vacation({
    name: 'Oregon Coast Getaway',
    slug: 'oregon-coast-getaway',
    category: 'Weekend Getaway',
    sku: 'OC39',
    description: 'Enjoy the ocean air and quaint coastal towns!',
    priceInCents: 269995,
    tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
    inSeason: false,
    maximumGuests: 8,
    available: true,
    packagesSold: 0,
  }).save();

  new Vacation({
    name: 'Rock Climbing in Bend',
    slug: 'rock-climbing-in-bend',
    category: 'Adventure',
    sku: 'B99',
    description: 'Experience the thrill of climbing in the high desert.',
    priceInCents: 289995,
    tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing'],
    inSeason: true,
    requiresWaiver: true,
    maximumGuests: 4,
    available: false,
    packagesSold: 0,
    notes: 'The tour guide is currently recovering from a skiing accident.',
  }).save();

});

User.find(function(err,users){
    if(users.length) return;

    new User({
        name: '123',
        password: '123456',
        email: '404544332@qq.com',
        create: new Date(),
        role: 'superagent',
        authId: '-1',
    }).save();
})


var tours = [
    {id: 0,name: 'Hood River',price: 99.99},
    {id: 1,name: 'Oregon Coast',price: 145.95},
];

function getWeatherData(){
    return {
       locations: [
          {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
           },
           {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
           },
           {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
           },
      ],
   };
}




var app = express();
switch(app.get('env')){
    case 'development': 
    app.use(require('morgan')('dev'));
    break;
    case 'production':
    app.use(require('express-logger')({
        path: __dirname + '/log/requests.log'
    }));
    break;
}
app.engine('handlebars',handlebars.engine);
app.set('view engine','handlebars');

var bundler = require('connect-bundle')(require('./config.js'));
app.use(bundler);

app.set('port',process.env.PORT || 3000);
app.use('/api',require('cors')());
app.use(express.static(__dirname + '/public'));
app.use(require('body-parser')());
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    store: sessionStore,
}));
var libStatic = require('./lib/static.js').map;

app.use(function(req,res,next){
    var now = new Date();
    res.locals.logoImage = now.getMonth() == 2 && now.getDate() == 21 ? libStatic('/img/0-7.gif') : libStatic('/img/0-8.gif');
    next();
});

app.use(function(req,res,next){
    var domain = require('domain').create();

    domain.on('error',function(err){
        console.log('DOMAIN ERROR CAUGHT\n',err.stack);
        try{
            setTimeout(function(){
                console.error('Failsafe shutdown.');
                process.exit(1);
            },5000);

            var worker = require('cluster').worker;
            if(worker) worker.disconnect();
            
            server.close();
            console.log('1');
            try{
                next(err);
            } catch (error1){
                console.error('Express error mechanism failed.\n',error1.stack);
                res.statusCode = 500;
                res.setHeader('Content-type','text/plain');
                res.end('Server error.');
            }  
        }catch (error2){
            console.error('Unable to send 500 response.\n',error2.stack);
        }
    });

    domain.add(req);
    domain.add(res);

    domain.run(next);

});


app.use(function(req,res,next){
    res.locals.showTest = app.get('env') !== 'production' && req.query.test === '1';
    next();
});

app.use(function(req,res,next){
    var cluster = require('cluster');
    if(cluster.isWorker) console.log('CLUSTER: Worker %d received request',cluster.worker.id);
    next();
});

app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

//关闭响应头的x-powered-by信息
app.disable('x-powered-by');

app.use(function(req,res,next){
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = getWeatherData();
    next();
});

app.use(function(req,res,next){
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});


app.use('/upload',function(req,res,next){
    var now = Date.now();
    jqupload.fileHandler({
        uploadDir: function(){
            return __dirname + '/public/uploads/' + now;
        },
        uploadUrl:function(){
            return '/uploads/' + now;
        },
    })(req,res,next);
});


var admin = express.Router();
app.use(require('vhost')('admin.*',admin));

admin.get('/',function(req,res){
    res.render('admin/home');
});

admin.get('/users',function(req,res){
    res.render('admin/users');
});


var routes = require('./router.js')(app);









var autoViews = {};

app.use(function(req,res,next){
    var path = req.path.toLowerCase();
    if(autoViews[path]) return res.render(autoViews[path]);
    if(fs.existsSync(__dirname + '/views' + path + '.handlebers')) {
        autoViews[path] = path.replace(/^\//,'');
        return res.render(autoViews[path]);
    }
    next();
});


// function Product(){
// }

// Product.find = function(conditions,fields,options,cb){
//     if(typeof conditions === 'function'){
//         cb = conditions;
//         conditions = {};
//         fields = null;
//         options = {};
//     }else if(typeof fields === 'function'){
//         cb = fields;
//         fields = null;
//         options = {};
//     }else if (typeof options === 'function'){
//         cb = options;
//         options = {};
//     }
//     var products = [
// 		{
// 			name: 'Hood River Tour',
// 			slug: 'hood-river',
// 			category: 'tour',
// 			maximumGuests: 15,
// 			sku: 723,
// 		},
// 		{
// 			name: 'Oregon Coast Tour',
// 			slug: 'oregon-coast',
// 			category: 'tour',
// 			maximumGuests: 10,
// 			sku: 446,
// 		},
// 		{
// 			name: 'Rock Climbing in Bend',
// 			slug: 'rock-climbing/bend',
// 			category: 'adventure',
// 			requiresWaiver: true,
// 			maximumGuests: 4,
// 			sku: 944,
// 		}
// 	];
//     cb(null,products.filter(function(product){
//         if(conditions.category && p.category !== conditions.category) return false;
//         if(conditions.slug && p.slug !== conditions.slug) return false;
//         if(isFinite(conditions.sku) && p.sku !== Number(conditions.sku)) return false;
//         return true;
//     }));
// };

// Product.findOne = function(conditions,fields,options,cb) {
//     if(typeof conditions === 'function') {
//         cb = conditions;
//         conditions = {};
//         fields = null;
//         options = {};
//     }else if(typeof fields === 'function') {
//         cb = fields;
//         fields = null;
//         options = {};
//     }else if(typeof options === 'function') {
//         cb = options;
//         options = {};
//     }
//     Product.find(conditions,fields,options,function(err,products){
//         cb(err, products && products.length ? products[0] : null);
//     });
// };


  


//将上下文传递给视图,包括查询字符串 cookie  session
app.get('/greeting',function(req,res){
    res.render('about',{
        message: 'welcome',
        style: req.query.style,
        userid: req.cookies.userid,
        username: req.session.username
    });
});

//下面的layout没有布局文件,即views/no-layout.handlebars
//必须包含必要的html
app.get('/no-layout',function(req,res){
    res.render('no-layout',{layout : null});
});

//使用定制布局文件渲染视图
//即使用views/layouts/custom.handlebars
app.get('/custom-layout',function(req,res){
    res.render('custom-layout',{layout : 'custom'});
});

//渲染纯文本
app.get('/text',function(req,res){
    res.type('text/plain');
    res.send('this is a text');
});

//基本表单处理
app.post('/process-contact',function(req,res){
    console.log('received contact from' + req.body.name + '<' + req.body.email + '>');
    res.redirect(302,'/thank-you');
});

//更强大的表单处理
app.post('/process-contact',function(req,res){
    console.log('received contact from' + req.body.name + '<' + req.body.email + '>');
    try {
        
        return res.xhr ? res.render({success : true}) : res.redirect(302,'/thank-you');
    } catch(ex){
        return res.xhr ? res.json({error : 'Database error.'}) : res.redirect(303,'/database-error');
    }
});

//简单的get节点 只返回json数据
app.get('/api/tours',function(req,res){
    res.json(tours);
});

//get节点 返回json xml text
app.get('api/tours',function(req,res){
    var toursxXml = '<?xml version="1.0"?><tours>' + tours.map(function(p){
        return '<tour prics = "' + p.price + '" id = "' + p.id + '" >' + p.name + '</tour>';
    }).join('' ) + '</tours>';
    var tourstext = tours.map(function(p){
        return p.id + ':' + p.name + '(' + p.price + ')';
    }).join('/n');
    res.format({
            'application/json': function(){
                res.json(tours);
            },
            'application/xml' : function(){
                res.type('application/xml');
                res.send(toursxXml);
            },
            'text/xml' : function(){
                res.type('text/xml');
                res.send(toursxXml);
            },
            'text/plain' : function(){
                res.type('text/plain');
                res.send(tour);
            }
    });

});

//用于更新的put节点
app.put('/api/tour/:id',function(req,res){
    var p = tours.some(function(p){
        return p.id == req.params.id;
    });

    if(p){
        if(req.query.name) p.name = req.query.name;
        if(req.query.price) p.email = req.query.price;
        res.json({success: true});
    }else {
        res.json({error: 'No such tour exists'});
    }

});

//用于删除的DELETE节点
app.delete('/api/tour/:id',function(req,res){
   var i;
   for(i = tours.length -1; i>=0; i--){
       if(tours[i].id == req.params.id) break;
   }
   if(i >= 0){
       tours.splice(i,1);
       res.json({success: true});
   }else {
       res.json({error: 'No such tour exists'});
   }
});


//api 



var apiOptions = {
    context: '/',
    domain: require('domain').create(),
};
var rest = require('connect-rest').create(apiOptions);


var Attraction = require('./model/attraction.js');

rest.get('attractions',function(req,content,cb){
    Attraction.find({ approved: true},function(err,attractions){
        if(err) return cb({error: 'Internal error.'});
        cb(null,attractions.map(function(a){
            return {
                name: a.name,
                id: a._id,
                description: a.description,
                location: a.location,
            };
        }));
    });
});

rest.post('attraction',function(req,content,cb){
    var a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: { lat:req.body.lat, lng: req.body.lng},
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });

    a.save(function(err,a){
        if(err) return cb({error: 'Unable to addattraction.'});
        cb(null,{id: a._id});
    });
});

rest.get('attraction/:id',function(req,content,cb){
    Attraction.findById(req.params.id,function(err,a){
        if(err) return cb({error: 'Unable to retrieve attraction.'});
        cb(null,{
            name: a.name,
            description: a.description,
            location: a.location,
        });
    });
});


apiOptions.domain.on('error',function(err){
    console.log('API domain error.\n',err.stack);
    setTimeout(function(){
        console.log('Server shutting down after API domain error.');
        process.exit(1);
    },5000);
    server.close();
    var worker = require('cluster').worker;
    if(worker) worker.disconnect();
});

app.use(require('vhost')('api.*',rest.processRequest()));


var auth = require('./lib/auth.js')(app,{
                                successRedirect: '/',
                                failRedirect: '/login',
                                provider: credentials.weibo,
                            });

auth.weiboInit();
auth.registerRoutes();


function customerOnly(req,res,next){
    var user = req.sesson.passport.user;
    if(user && req.role === 'customer') return next();
    return res.redirect(303,'/login');
};

function employeeOnly(req,res,next){
    var user = req.session.passport.user;
    if(user && req.role === 'employee') return next();
    next('route');
};

app.get('/account',customerOnly,function(req,res){
    res.render('account');
});

app.get('/account/order-history',customerOnly,function(req,res){
    res.render('account/order-history');
});

app.get('/account/email-prefs',customerOnly,function(req,res){
    res.render('account/email-prefs');
});

function allow(roles){
    var user = req.session.passport.user;
    if(user && roles.split(',').indexOf(user.role) !== -1) return next();
    res.redirect(303,'/unauthorized');
}

app.get('/account',allow,function(req,res){
    res.render('/account');
});

//员工路由
app.get('/sales',employeeOnly,function(req,res){
    res.render('sales');
});


app.use(function(req,res,next){
    //res.type('text/plain');
    res.status(404);
    //res.send('404 - nofound');
    res.render('404');
});

app.use(function(err,req,res,next){
    console.log(err.stack);
    //res.type('text/plain');
    res.status(500);
    //res.send('500 - server error');
    res.render('500');
});

var server;

var options = {
    key:fs.readFileSync(__dirname + '/ssl/ca.key'),
    cert:fs.readFileSync(__dirname + '/ssl/ca.crt'),
};

function startServer(){
    server = https.createServer(options,app).listen(app.get('port'),function(){
    console.log('Express started in ' + app.get('env') + ' on http://localhost:' +
        app.get('port') + '; press Ctrl-C to terminate.');
    });
}

if(require.main === module){
    startServer();
}else {
    module.exports = startServer;
}



