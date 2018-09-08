const config = require('config');
const Plugins = require('../models/plugins');
const moment = require('moment');

module.exports = {
	async view(ctx) {
		const plugin = await Plugins.findOne({ project: ctx.params.project });

		if (plugin == null) return ctx.throw(404, 'Project not found!');

		const created = [
			moment(plugin.created).fromNow(),
			moment(plugin.created).format('YYYY-MM-DD')
		];

		let updated = [
			moment(plugin.releases[0].created).fromNow(),
			moment(plugin.releases[0].created).format('YYYY-MM-DD')
		];

		return await ctx.render('project', {
			pretty: config.prettyHtml,
			title: config.name,
			created: created,
			updated: updated,
			readme: plugin.releases[0].readme,
			plugin: plugin
		});
	}
};
