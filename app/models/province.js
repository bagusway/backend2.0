var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProvinceSchema = new Schema({
    id_province: { type: String, },
    province_name: { type: String, }
});

module.exports = mongoose.model('Province', ProvinceSchema);