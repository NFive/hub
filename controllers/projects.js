const config = require('config');
const Plugins = require('../models/plugins');
const moment = require('moment');

module.exports = {
	async view(ctx) {
		const version = ctx.params.version;

		const plugin = await Plugins.findOne({ project: ctx.params.project });

		if (plugin == null) return ctx.throw(404, 'Project not found!');

		let release = plugin.releases[0];

		if (version) {
			release = plugin.releases.filter(r => r.tag == version)[0];
		}

		if (release == null) return ctx.throw(404, plugin.name + ' version ' + version + ' not found!');

		let created = [ "No Release" ]
		let updated = [ "No Release" ]

		if (plugin.has_release) {
			created = [
				moment(plugin.created).fromNow(),
				moment(plugin.created).format('YYYY-MM-DD')
			];

			updated = [
				moment(release.created).fromNow(),
				moment(release.created).format('YYYY-MM-DD')
			];

			readme = release.readme
		} else {
			readme = plugin.readme
		}

		return await ctx.render('project', {
			pretty: config.prettyHtml,
			title: config.name,
			created: created,
			updated: updated,
			readme: readme,
			plugin: plugin,
			release: release
		});
	}
};
