const mongoose = require('mongoose');

const data = new mongoose.Schema({
    gh_id: { type: Number, unique: true},
    user: { type: String},             //owner/login
    repo: { type: String },             //name
    full_name: { type: String },        //full_name
    user_url: { type: String },         //owner/html_url
    avatar_url: { type: String },       //owner/avatar_url
    repo_url: { type: String },         //html_url
    description: { type: String },      //discription
    plugincreated: { type: Date},       //created_at
    pluginupdated: { type: Date},       //updated_at
    license_key: { type: String },      //license/id
    license_name: { type: String },     //license/name
    license_short: { type: String },    //license/spdx_id
    licesne_url: { type: String },      //license/_links/html
    last_grab: { type: Date, default: Date.now()}         
}, 
{
    _id: false,
	timestamps: true
});

module.exports = mongoose.model('plugins', data);