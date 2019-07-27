const config = require('config');
const Plugins = require('../models/plugins');

const errorPage = require('./error');

module.exports = {
	async view(ctx) {
		const perPage = 15;
		let page = 1;

		if (ctx.query.page) {
			page = Number(ctx.query.page);
		}

		if (!Number.isInteger(page)) await errorPage.show(ctx, `${ctx.query.q} not found!`);

		const totalResults = await module.exports.count(ctx.query.q);
		const totalPages = Math.ceil(totalResults / perPage);

		if (page < 1 || page > totalPages) await errorPage.show(ctx, 'Page not found!');

		const results = await module.exports.search(ctx.query.q, perPage, page);

		return await ctx.render('search', {
			pretty: config.prettyHtml,
			title: config.name,
			query: ctx.query.q,
			page: page,
			totalPlugins: totalResults,
			pagedResults: results,
			totalPages: totalPages,
			url: '/search?q=' + ctx.query.q + '&page=',
			prev: page - 1,
			next: page + 1
		});
	},

	async count(query) {
		return (await Plugins.countDocuments(
			{
				$text: {
					$search: query
				}
			}
		));
	},

	async search(query, perPage = 9999, page = 1) {
		return (await Plugins.find({
			$text: {
				$search: query
			}
		}, {
			score: {
				$meta: 'textScore'
			}
		}, {
			skip: perPage * (page - 1),
			limit: perPage
		}).sort({
			score: {
				$meta: 'textScore'
			}
		})).filter(r => r.has_release);
	}
};
