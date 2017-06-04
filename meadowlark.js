var express = require('express');
var handlebars = require('express-handlebars')
            .create(
                {defaultLayout : 'main',
                 helpers : {
                    section : function(name,options){
                        if(!this._sections) this._sections = {};
                        this._sections[name] = options.fn(this);
                        return null;
                    }
                }
        });
var randomFortune = require('./lib/fortune.js').getRandomFortunes;

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
app.engine('handlebars',handlebars.engine);
app.set('view engine','handlebars');

app.set('port',process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));
app.use(function(req,res,next){
    res.locals.showTest = app.get('env') !== 'production' && req.query.test === '1';
    next();
});


//关闭响应头的x-powered-by信息
app.disable('x-powered-by');

app.use(function(req,res,next){
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = getWeatherData();
    next();
});

app.use(require('body-parser')());


app.get('/header',function(req,res){
    res.type('text/plain');
    var s = '';
    for (var name in req.headers) {
        s += name + ':' + req.headers[name] + '\n';
    }
    res.send(s);
});

app.get('/',function(req,res){
    // res.type('text/plain');
    // res.send('Meadowlark travel');
    res.render('home');
});

app.get('/about',function(req,res){
    // res.type('text/plain');
    // res.send('about Meadowlark travel');
    
    res.render('about',{fortune : randomFortune(),
                        pageTestScript : '/qa/tests-about.js'
                       });
    
});

app.get('/tours/hood-river',function(req,res){
    res.render('tours/hood-river');
});

app.get('/tours/request-group-rate',function(req,res){
    res.render('tours/request-group-rate');
});

app.get('/jquerytest',function(req,res){
    res.render('jquerytest');
});

app.get('/newsletter',function(req,res){
    res.render('newsletter',{csrf : 'CSRF token goes here'});
})

app.post("/process",function(req,res){

    if(req.xhr || req.accepted('json,html') === 'json'){
        res.json({success: true});
    }else {
        res.redirect(303,'/thank-you');
    }

    // console.log('Form (from queryString): '+ req.query.form);
    // console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    // console.log('Name (from visible from field): ' + req.body.name);
    // console.log('Email (from visible form filed): ' + req.body.email);
    // res.redirect(303,'/thank-you');
});

app.get('/thank-you',function(req,res){
    res.render('thank-you');
});



//将上下文传递给视图,包括查询字符串 cookie  session
app.get('/greeting',function(req,res){
    res.render('about',{
        message: 'welcome',
        style: req.query.style,
        userid: req.cookies.userid,
        username: req.session.username
    })
})

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
})

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
                res.send(tour)
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
   for(var i = tours.length -1; i>=0; i--){
       if(tours[i].id == req.params.id) break;
   };
   if(i >= 0){
       tours.splice(i,1);
       res.json({success: true});
   }else {
       res.json({error: 'No such tour exists'});
   }
});

//为客户端模版的调试
app.get('/nursery-rhyme', function(req, res){
           res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function(req, res){
        res.json({
                    animal: 'squirrel',
                    bodyPart: 'tail',
                    adjective: 'bushy',
                    noun: 'heck',
        });
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

app.listen(app.get('port'),function(){
    console.log('Express started on http://localhost:' +
        app.get('port') + '; press Ctrl-C to terminate.');
});


