var mongoose = require('mongoose');
var orderSchema = mongoose.Schema({

});

var orders = mongoose.model('Order',orderSchema);
module.exports = orders;