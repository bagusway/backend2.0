var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SidebarSchema = new Schema({
    id_menu: { type: Number },
    menu_name: { type: String },
    icon: { type: String },
    link: { type: String },
    category: { type: String },
    id_user: { type: String },
    name: { type: String }
});

module.exports = mongoose.model('Sidebar', SidebarSchema);