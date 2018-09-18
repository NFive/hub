const config = require('config');
const lodash = require('lodash');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		const results = await module.exports.search(ctx.query.q);

		const perPage = 15;
		let page = 1;

		const totalPages = Math.ceil(results.length / perPage);
		if (ctx.query.page) {
			page = Number(ctx.query.page);
		}

		if (!Number.isInteger(page)) return ctx.throw(404, 'Page not found!');
		if (page < 1 || page > totalPages) return ctx.throw(404, 'Page not found!');

		const pagedResults = results.slice(
			perPage * page - perPage,
			perPage * page
		);

		return await ctx.render('search', {
			pretty: config.prettyHtml,
			title: config.name,
			query: ctx.query.q,
			page: page,
			totalPlugins: results.length,
			pagedResults: pagedResults,
			totalPages: totalPages,
			url: '/search?q=' + ctx.query.q + '&page=',
			prev: page - 1,
			next: page + 1
		});
	},

	async json(ctx) {
		ctx.body = lodash.map(await module.exports.search(ctx.query.q), r =>
			lodash.pick(r, [
				'owner',
				'project',
				'name',
				'releases',
				'counts',
				'project_downloads'
			])
		);
	},

	async search(query) {
		return (await Plugins.find(
			{
				$text: {
					$search: query
				}
			},
			{
				score: {
					$meta: 'textScore'
				}
			}
		).sort({
			score: {
				$meta: 'textScore'
			}
		})).filter(r => r.has_release);
	}
};
