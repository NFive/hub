const config = require('config');
const Plugins = require('../models/plugins');
const moment = require('moment');
const fetch = require("node-fetch");
const marked = require('marked');

module.exports = {
	async view(ctx) {
		const plugin = await Plugins.findOne({ project: ctx.params.project });

		if (plugin == null) return ctx.throw(404, 'Project not found!');

		const created = [
			moment(plugin.creationdate).fromNow(),
			moment(plugin.creationdate).format("YYYY-MM-DD")
		]


		let updated = [
			moment(plugin.releases[0].created).fromNow(),
			moment(plugin.releases[0].created).format("YYYY-MM-DD")
		]

		const readme = await fetch(plugin.releases[0].readme)
		.then(res => res.text())
		//.then(body => body);



		return await ctx.render('project', {
			pretty: config.prettyHtml,
			title: config.name,
			created: created,
			updated: updated,
			readme: readme,
			plugin: plugin
		});
	}
};
