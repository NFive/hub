const config = require('config');
const util = require('util')
const moment = require('moment');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {
		try {
			const totalPlugins = await Plugins.countDocuments({
				releases: {
					$exists: true,
					$not: {
						$size: 0
					}
				}
			});

			const installs = await Plugins.aggregate([{
				$unwind: '$releases'
			}, {
				$group: {
					_id: null,
					total: {
						$sum: '$releases.downloads'
					}
				}
			}]);

			const versions = await Plugins.aggregate([{
				$unwind: '$releases'
			}, {
				$group: {
					_id: null,
					total: {
						$sum: 1
					}
				}
			}]);

			const top = await Plugins.aggregate([{
				$unwind: '$releases'
			}, {
				$group: {
					_id: '$_id',
					total: {
						$sum: '$releases.downloads'
					},
					owner: { $first: '$owner' },
					project: { $first: '$project' },
					avatar_url: { $first: '$avatar_url' },
					description: { $first: '$description' },
					releases: { $first: '$releases' }
				}
			}, {
				$sort: {
					'total': -1
				}
			}, {
				$limit: 9
			}, {
				$project: {
					_id: 0,
					owner: 1,
					project: 1,
					avatar_url: 1,
					description: 1,
					releases: 1
				}
			}]);

			return await ctx.render('index', {
				pretty: config.prettyHtml,
				title: config.name,
				uniquePlugins: totalPlugins.toLocaleString(),
				pluginInstalls: installs[0].total.toLocaleString(),
				pluginVersions: versions[0].total.toLocaleString(),
				top: top.map(p => new Plugins(p)),
				moment: moment
			});
		} catch (ex) {
			util.log(ex)
		}
	}
};
