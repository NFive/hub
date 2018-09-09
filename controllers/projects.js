const config = require('config');
const Plugins = require('../models/plugins');
const moment = require('moment');

module.exports = {
	async view(ctx) {
		const plugin = await Plugins.findOne({ project: ctx.params.project });

		if (plugin == null) return ctx.throw(404, 'Project not found!');

		let created = [ "No Release" ]
		let updated = [ "No Release" ]

		if (plugin.has_release) {
			created = [
				moment(plugin.created).fromNow(),
				moment(plugin.created).format('YYYY-MM-DD')
			];

			updated = [
				moment(plugin.releases[0].created).fromNow(),
				moment(plugin.releases[0].created).format('YYYY-MM-DD')
			];

			readme = plugin.releases[0].readme
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
			tab: 'readme'
		});
	}
};
