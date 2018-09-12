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

		const readme = plugin.has_release ? release.readme : plugin.readme;

		return await ctx.render('project', {
			pretty: config.prettyHtml,
			title: plugin.name + config.name,
			readme: readme,
			plugin: plugin,
			release: release,
			moment: moment
		});
	}
};
