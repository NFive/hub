const config = require('config');
const lodash = require('lodash');
const approx = require('numeral');
const Plugins = require('../models/plugins');

module.exports = {
	async view(ctx) {

		let plugins = await Plugins.find({})
		plugins = plugins.filter(p => p.has_release)
		let releases = await plugins.map(r => r.releases)
		let versions = await [].concat.apply([], releases)
		//let downloads = await versions.map(r => r.downloads)

		// Needs Adding to Virtual
		const totalPlugins = approx(plugins.length).format('0,0')
		const totalVersions = approx(versions.length).format('0,0')
		// Needs Adding to Virtual
		const totalDownloads = approx(lodash.sumBy(plugins.map((r) => r.project_downloads))).format('0,0')

		return await ctx.render('index', {
			pretty: config.prettyHtml,
			title: config.name,
			plugins: plugins,
			uniquePlugins: totalPlugins,
			pluginInstalls: totalDownloads,
			pluginVersions: totalVersions
		});
	}};
