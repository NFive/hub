const config = require('config');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		const plugin = await Plugins.findOne({ user: ctx.params.org });

		if (plugin == null) return ctx.throw(404, 'Org not found!');

		return await ctx.render('org', {
			pretty: config.prettyHtml,
			title: config.name,
			plugin: plugin
		});
	}
};
