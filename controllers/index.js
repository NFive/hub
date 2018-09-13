const config = require('config');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {

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

		return await ctx.render('index', {
			pretty: config.prettyHtml,
			title: config.name,
			Plugins: Plugins,
			uniquePlugins: totalPlugins.toLocaleString(),
			pluginInstalls: installs[0].total.toLocaleString(),
			pluginVersions: versions[0].total.toLocaleString()
		});
	}};
