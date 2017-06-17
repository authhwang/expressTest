var mongoose = require('mongoose');

var vacationInSeasonListerSchema = mongoose.Schema({
    email: String,
    skus: [String],
});
var VacationInSeasonListener = mongoose.model('VacationInSeasonLister',vacationInSeasonListerSchema);
module.exports = VacationInSeasonListener;