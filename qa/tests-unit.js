var fontune = require('../lib/fortune.js');
var expect = require('chai').expect;

suite('Fortune cookie tests',function(){

    test('getFortune() should return a Fortune',function(){
        expect(typeof fontune.getRandomFortunes() === 'string');
    });
});

