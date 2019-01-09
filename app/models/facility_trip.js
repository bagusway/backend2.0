var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FacilitySchema = new Schema({
    id_facility: { type: String, },
    facility_name: { type: String, },
    facility_category: { type: Number },
    flag_facility: { type: Number, default: 0 },
    facility_photo: { type: String }
});

module.exports = mongoose.model('Facilitytrip', FacilitySchema);