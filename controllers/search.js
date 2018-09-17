const config = require('config');
const lodash = require('lodash');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {

		return await ctx.render('search', {
			pretty: config.prettyHtml,
			title: config.name,
			query: ctx.query.q,
			results: await module.exports.search(ctx.query.q)
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
