const config = require('config');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		const plugin = await Plugins.findOne({ repo: ctx.params.project });

		if (plugin == null) return ctx.throw(404, 'Project not found!');

		return await ctx.render('project', {
			pretty: config.prettyHtml,
			title: config.name,
			plugin: plugin
		});
	}
};
