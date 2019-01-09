var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CategorySchema = new Schema({
    id_category: { type: String, },
    category_name: { type: String, },
    category_photo: { type: String }
});

module.exports = mongoose.model('Categorytrip', CategorySchema);