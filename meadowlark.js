var express = require('express');
var handlebars = require('express-handlebars')
            .create({defaultLayout : 'main'});
var randomFortune = require('./lib/fortune.js').getRandomFortunes;

var app = express();
app.engine('handlebars',handlebars.engine);
app.set('view engine','handlebars');

app.set('port',process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));


app.get('/',function(req,res){
    // res.type('text/plain');
    // res.send('Meadowlark travel');
    res.render('home');
})

app.get('/about',function(req,res){
    // res.type('text/plain');
    // res.send('about Meadowlark travel');
    
    res.render('about',{fortune : randomFortune()});
    
});

app.use(function(req,res,next){
    //res.type('text/plain');
    res.status(404);
    //res.send('404 - nofound');
    res.render('404');
})

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


