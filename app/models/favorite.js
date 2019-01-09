var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FavoriteSchema = new Schema({
    id_trip: {
        type: Schema.Types.ObjectId,
        ref: 'Trip'
    },
    id_user: {
        type: Schema.Types.ObjectId,
        ref: 'Trip'
    },
    flag_favorite: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Favorite', FavoriteSchema);