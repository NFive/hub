const config = require('config');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		const plugins = await Plugins.find({ org: ctx.params.org });

		if (plugins.length < 1) return ctx.throw(404, 'Org not found!');

		return await ctx.render('org', {
			pretty: config.prettyHtml,
			title: config.name,
			org: plugins[0].org,
			plugins: plugins
		});
	}
};
