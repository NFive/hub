const mongoose = require('mongoose');
const lodash = require('lodash');

const Release = new mongoose.Schema({
	tag: { type: String, required: true },
	downloads: { type: Number, required: true },
	download_url: {type: String},
	notes: String,
	readme: String,
	created: { type: Date, required: true }
});

const Repositories = new mongoose.Schema({
	gh_id: { type: Number, required: true, unique: true },
	owner: { type: String, required: true, index: true },
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
	readme: String,
	created: { type: Date, required: true },
	scraped: { type: Date, required: true, default: Date.now() }
});

Repositories.virtual('name').get(function () {
	return this.owner + '/' + this.project;
});

Repositories.virtual('gh_url').get(function () {
	return 'https://github.com/' + this.name;
});

Repositories.virtual('has_release').get(function () {
	return this.releases && this.releases.length;
});

Repositories.virtual('latest_version').get(function () {
	return this.releases[0].tag;
});

Repositories.virtual('has_readme').get(function () {
	return this.has_releases && this.releases.readme == null;
});

Repositories.virtual('has_notes').get(function () {
	return this.has_releases && this.releases.notes == null;
});

Repositories.virtual('project_downloads').get(function () {
	return lodash.sumBy(this.releases, (o) => o.downloads);
});

Repositories.index({
	owner: 'text',
	project: 'text',
	description: 'text'
});

module.exports = mongoose.model('plugins', Repositories);
