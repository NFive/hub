const mongoose = require('mongoose');

const Release = new mongoose.Schema({
	tag: { type: String, required: true },
	downloads: { type: Number, required: true },
	notes: String,
	readme: String,
	created: { type: Date, required: true }
});

const Repositories = new mongoose.Schema({
	gh_id: { type: Number, required: true, unique: true },
	org: { type: String, required: true, index: true },
	project: { type: String, required: true, index: true },
	description: { type: String, index: true },
	license: String,
	avatar_url: String,
	homepage_url: String,
	counts: {
		stars: Number,
		watchers: Number,
		forks: Number,
		issues: Number
	},
	releases: [Release],
	created: { type: Date, required: true },
	scraped: { type: Date, required: true, default: Date.now() }
});

Repositories.virtual('name').get(() => this.org + '/' + this.project);

module.exports = mongoose.model('plugins', Repositories);
