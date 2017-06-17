var main = require('./handlers/main.js');
var contest = require('./handlers/contest.js');
var vacation = require('./handlers/vacation.js');
var cart = require('./handlers/cart.js');
var cartValidation = require('./lib/cartValidation.js');
var contact = require('./handlers/contact.js');
var sample = require('./handlers/sample.js');

module.exports = function(app){

    //miscellaneous routes
    app.get('/',main.home);
    app.get('/about',main.about);
    app.get('/newsletter',main.newsletter);
    app.post('/newsletter',main.newsletterProcessPost);
    app.get('/newsletter/archive',main.newlettersArchive);
    app.get('/thank-you',main.thankyou);

    //contest routes
    app.get('/contest/vacation-photo',contest.vacationPhoto);
    app.post('/contest/vacation-photo/:year/:month',contest.vacationPhotoProcessPost);
    app.get('/contest/vacation-photo/entries',contest.vacationPhotoEntries);

    //vacation routes
    app.get('/vacations',vacation.list);
    app.get('/vacation/:vacation',vacation.detail);
    app.get('/notify-me-when-in-sesson',vacation.notifyWhenInSeason);
    app.post('/notify-me-when-in-season',vacation.notiftWhwnInSeasonProcessPost);

    //shopping cart routes 
    app.get('/cart',cart.middleware,cartValidation.checkWaivers,cartValidation.checkGuestCounts,cart.home);
    app.get('/cart/add',cart.addProcessGet);
    app.get('/cart/add',cart.addProcessPost);
    app.get('/cart/checkout',cart.checkout);
    app.post('/cart/checkout',cart.checkoutProcessPost);
    app.get('/cart/thank-you',cart.thankyou);
    app.get('/email/cart/thank-you',cart.emailThankYou);
    app.get('/set-currency/:currency',cart.setCurrency);

    //contact
    app.get('/request-group-rate',contact.requestGroupRate);
    app.post('/request-group-rate',contact.requestGroupRateProcessPost);
    app.get('/contact',contact.home);
    app.post('/contact',contact.homePorcessPost);

    // testing/sanple routes
    app.get('/jquery-test',sample.jqueryTest);
    app.get('/nursery-rhyme',sample.nurseryRhyme);
    app.get('/data/nursery-rhyme',sample.nurseryRhymeData);
    app.get('/epic-fall',sample.epicfail);

}