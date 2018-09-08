const mongoose = require('mongoose');

const Releases = new mongoose.Schema({ tag: String, created: String, notes: String, downloads: Number, readme: String });
const Counts = new mongoose.Schema({ stars: Number, watchers: Number, forks: Number, issues: Number, })
const Repositories = new mongoose.Schema({
	gh_id: { type: Number, unique: true },
	org: String,               	//owner.login
	project: String,          	//name
	full_name: String,        	//full_name
	org_url: String,          	//owner.html_url
	project_url: String,      	//html_url
	avatar_url: String,       	//owner.avatar_url
	homepage_url: String,		//homepage
	description: String,      	//discription
	releases: [Releases],
	counts: [Counts],
	license: String,			//license.key
	creationdate: Date,       	//created_at
	last_grab: { type: Date, default: Date.now() }
},{	timestamps: false });

Repositories.index({
	org: 'text',
	project: 'text',
	full_name: 'text',
	description: 'text'
});

module.exports = mongoose.model('plugins', Repositories);
