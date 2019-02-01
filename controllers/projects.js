const config = require('config');
const util = require('util')
const moment = require('moment');
const semver = require('semver');
const Plugins = require('../models/plugins');

const errorPage = require('./error')

module.exports = {
	async view(ctx) {
		try {
			const version = ctx.params.version;

			const plugin = await Plugins.findOne({ project: ctx.params.project });
			if (plugin == null) await errorPage.show(ctx, 'Plugin not found!')

			let releases = plugin.releases;
			if (plugin.has_release) {
				releases = releases.sort((a, b) => semver.rcompare(a.tag, b.tag));
			}

			let selectedRelease = releases[0];
			if (version) {
				selectedRelease = plugin.releases.filter(r => r.tag == version)[0];
			}

			if (selectedRelease == null) await errorPage.show(ctx, `${plugin.name} version ${version} not found!`);

			const readme = plugin.has_release ? selectedRelease.readme : plugin.readme;

			return await ctx.render('project', {
				pretty: config.prettyHtml,
				title: plugin.name + ' · ' + config.name,
				readme: readme,
				plugin: plugin,
				release: selectedRelease,
				releases: releases,
				moment: moment
			});
		} catch (ex) {
			util.log(ex)
		}
	}
};
