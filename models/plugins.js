const mongoose = require('mongoose');

const Plugins = new mongoose.Schema({
	gh_id: { type: Number, unique: true},
	org: String,               	//owner.login
	project: String,          	//name
	full_name: String,        	//full_name
	org_url: String,          	//owner.html_url
	project_url: String,      	//html_url
	avatar_url: String,       	//owner.avatar_url
	homepage_url: String,		//homepage
	description: String,      	//discription
	readme: String,				//
	version: String,			//releases.id.version
	downloadcount: Number,		//
	license_key: String,      	//license.id
	license_name: String,    	//license.name
	license_short: String,    	//license.spdx_id
	license_url: String,      	//license.html
	plugincreated: Date,       	//created_at
	pluginupdated: Date,       	//updated_at
	last_grab: { type: Date, default: Date.now()}
},
{
	timestamps: true
});

Plugins.index({
	org: 'text',
	project: 'text',
	full_name: 'text',
	description: 'text'
});

module.exports = mongoose.model('plugins', Plugins);
