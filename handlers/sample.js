exports.jqueryTest = function(req,res){
    res.render('jquerytest');
};

//为客户端模版的调试
exports.nurseryRhyme = function(req,res){
    res.render('nursery-rhyme');    
}

exports.nurseryRhymeData = function(req,res){
    res.json({
                animal: 'squirrel',
                bodyPart: 'tail',
                adjective: 'bushy',
                noun: 'heck',
    });
}

exports.epicfail = function(req,res){
     process.nextTick(function(){
        throw new Error('Kaboom!');
    });
}