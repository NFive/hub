const config = require('config');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		console.log(ctx.params);

		const plugins = await Plugins.find({
			$text: {
				$search: ctx.query.q
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

		return await ctx.render('search', {
			pretty: config.prettyHtml,
			title: config.name,
			query: ctx.query.q,
			results: plugins
		});
	}
};
