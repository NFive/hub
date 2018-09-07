const config = require('config');
const _ = require('lodash');
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
		ctx.body = _.map(await module.exports.search(ctx.query.q), r => _.pick(r, ['user', 'repo', 'license_short']));
	},

	async search(query) {
		return await Plugins.find({
			$text: {
				$search: query
			}
		},
		{
			score: {
				$meta: 'textScore'
			}
		}).sort({
			score: {
				$meta: 'textScore'
			}
		});
	}
};
