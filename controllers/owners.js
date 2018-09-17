const config = require('config');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		const plugins = await Plugins.find({ owner: ctx.params.owner });

		if (plugins.length < 1) return ctx.throw(404, 'Owner not found!');

		return await ctx.render('owner', {
			pretty: config.prettyHtml,
			title: config.name,
			owner: plugins[0].owner,
			plugins: plugins
		});
	}
};
