const config = require('config');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		const org = await Plugins.findOne({ user: ctx.params.org });

		if (org == null) return ctx.throw(404, 'Org not found!');

		return await ctx.render('org', {
			pretty: config.prettyHtml,
			title: config.name,
			org: org
		});
	}
};
