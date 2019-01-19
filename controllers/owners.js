const config = require('config');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		const plugins = (await Plugins.find({ owner: ctx.params.owner })).filter(r => r.has_release);
		const perPage = 10;
		let page = 1;
		const totalPages = Math.ceil(plugins.length / perPage);

		if (ctx.query.page) page = Number(ctx.query.page);

		if (!Number.isInteger(page)) return ctx.throw(404, 'Page not found!');
		if (page < 1 || page > totalPages) return ctx.throw(404, 'Page not found!');
		if (plugins.length < 1) return ctx.throw(404, 'Owner not found!');

		const pagedResults = plugins.slice(
			perPage * page - perPage,
			perPage * page
		);

		return await ctx.render('owner', {
			pretty: config.prettyHtml,
			title: plugins[0].owner + ' · ' + config.name,
			owner: plugins[0].owner,
			plugins: plugins,
			page: page,
			totalPlugins: plugins.length,
			pagedResults: pagedResults,
			totalPages: totalPages,
			urlPage: ctx.params.owner + '?page=',
			prev: page - 1,
			next: page + 1,
			url: ctx.href
		});
	}
};
