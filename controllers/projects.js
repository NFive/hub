const config = require('config');
const Plugins = require('../models/plugins');
const moment = require('moment');
const semver = require('semver')

module.exports = {
	async view(ctx) {
		const version = ctx.params.version;

		const plugin = await Plugins.findOne({ project: ctx.params.project });
		if (plugin == null) return ctx.throw(404, 'Project not found!');

		let releases = plugin.releases;
		if (plugin.has_release) { releases = releases.sort((a, b) => semver.rcompare(a.tag, b.tag)) }

		let selectedrelease = releases[0];
		if (version) {
			selectedrelease = plugin.releases.filter(r => r.tag == version)[0];
		}
		if (selectedrelease == null) return ctx.throw(404, plugin.name + ' version ' + version + ' not found!');

		const readme = plugin.has_release ? selectedrelease.readme : plugin.readme;

		return await ctx.render('project', {
			pretty: config.prettyHtml,
			title: plugin.name + ' · ' + config.name,
			readme: readme,
			plugin: plugin,
			release: selectedrelease,
			releases: releases,
			moment: moment
		});
	}
};
