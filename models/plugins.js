const mongoose = require('mongoose');

const Release = new mongoose.Schema({
	tag: String,
	created: Date,
	notes: String,
	downloads: Number,
	readme: String
});

const Repositories = new mongoose.Schema({
	gh_id: { type: Number, unique: true },
	org: String,
	project: String,
	avatar_url: String,
	homepage_url: String,
	description: String,
	releases: [Release],
	counts: {
		stars: Number,
		watchers: Number,
		forks: Number,
		issues: Number
	},
	license: String,
	created: Date,
	scraped: { type: Date, default: Date.now() }
});

Repositories.index({
	org: 'text',
	project: 'text',
	description: 'text'
});

module.exports = mongoose.model('plugins', Repositories);
