const mongoose = require('mongoose');
const lodash = require('lodash');

const Dependency = new mongoose.Schema({
	plugin: { type: String, require: true},
	version: { type: String, require: true}
});

const Release = new mongoose.Schema({
	version: { type: String, required: true },
	download_url: { type: String, required: true },
	compatible: { type: Boolean, required: true, default: true }, //TODO Remove `default: true` when capable of detecting NFive compatibility
	downloads: { type: Number },
	notes: String,
	readme: String,
	dependencies: [Dependency],
	createdAt: { type: Date, required: true },
	updatedAt: { type: Date, default: null },
	deletedAt: { type: Date, default: null }
});

const Repositories = new mongoose.Schema({
	gh_id: { type: Number, required: true, unique: true },
	install_id: { type: Number, required: true, unique: true},
	owner: { type: String, required: true },
	project: { type: String, required: true },
	description: String,
	license: String, // TODO Parse SPDX to array of licenses
	homepage_url: String,
	avatar_url: String,
	counts: {
		stars: Number,
		watchers: Number,
		forks: Number,
		issues: Number
	},
	releases: [Release],
	createdAt: { type: Date, required: true },
	updatedAt: { type: Date, default: null },
	deletedAt: { type: Date, default: null }
});

Repositories.virtual('name').get(function () {
	return this.owner + '/' + this.project;
});
Repositories.virtual('gh_url').get(function () {
	return 'https://github.com/' + this.name;
});
Repositories.virtual('gh_url_owner').get(function () {
	return 'https://github.com/' + this.owner;
});
Repositories.virtual('has_release').get(function () {
	return this.releases && this.releases.length;
});
Repositories.virtual('latest_version').get(function () {
	return this.releases[0].version;
});
Repositories.virtual('has_readme').get(function () {
	return this.has_releases && this.releases.readme == null;
});
Repositories.virtual('has_notes').get(function () {
	return this.has_releases && this.releases.notes == null;
});
Repositories.virtual('project_downloads').get(function () {
	return lodash.sumBy(this.releases, (r) => r.downloads);
});

Repositories.index({
	owner: 'text',
	project: 'text',
	description: 'text',
	readme: 'text'
});

module.exports = mongoose.model('plugins', Repositories);
