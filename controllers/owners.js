const config = require('config');
const util = require('util')
const Plugins = require('../models/plugins');

const errorPage = require('./error');

module.exports = {
	async view(ctx) {
		try {
			const plugins = (await Plugins.find({ owner: ctx.params.owner })).filter(r => r.has_release);
			const perPage = 10;
			let page = 1;
			const totalPages = Math.ceil(plugins.length / perPage);

			if (ctx.query.page) page = Number(ctx.query.page);

			if (!Number.isInteger(page)) await errorPage.show(ctx, 'Page not Found!')
			if (page < 1 || page > totalPages) await errorPage.show(ctx, 'Page not Found!')
			if (plugins.length < 1) await errorPage.show(ctx, 'Owner not Found!')

			const pagedResults = plugins.slice(
				perPage * page - perPage,
				perPage * page
			);

			return await ctx.render('owner', {
				pretty: config.prettyHtml,
				title: config.name,
				owner: plugins[0].owner,
				plugins: plugins,
				page: page,
				totalPlugins: plugins.length,
				pagedResults: pagedResults,
				totalPages: totalPages,
				url: ctx.params.owner + '?page=',
				prev: page - 1,
				next: page + 1
			});
		} catch (ex) {
			util.log(ex)
		}
	}
};
