var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var today = new Date();

//var year = today.getFullYear();
//var month = ('0' + (today.getMonth() + 1)).slice(-2);
//var day = ('0' + today.getDate()).slice(-2);

//var dateString = year + '-' + month  + '-' + day;

var commentSchema = new Schema({
    contents: String,
    author: String,
    comment_date: {type: Date, default: Date.now()}
});

var boardSchema = new Schema({
    title: String,
    contents: String,
    shareG: Number,
    salePrice: Number,
    id: String,
    airline: String,
    flight: String,
    board_date: {type: Date, default: Date.now()},
    comments: [commentSchema]
});


module.exports = mongoose.model('board', boardSchema);