const config = require('config');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		const project = await Plugins.findOne({ user: ctx.params.project });

		if (project == null) return ctx.throw(404, 'Project not found!');

		return await ctx.render('project', {
			pretty: config.prettyHtml,
			title: config.name,
			project: project
		});
	}
};
