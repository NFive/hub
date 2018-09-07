const cronjob = require('cron').CronJob;
const rest = require('@octokit/rest');
const github = new rest();
const Plugins = require('../models/plugins');
const util = require('util');

(async () => {
	try {
		const result = await github.search.repos({ q: 'topic:nfive-plugin' });

		for (let i of result.data.items) {
			try {
				await Plugins.findOneAndUpdate({gh_id: i.id}, {
					//gh_id: i.id,
					org: i.owner.login,
					project: i.name,
					full_name: i.full_name,
					org_url: i.owner.html_url,
					project_url: i.html_url,
					avatar_url: i.owner.avatar_url,
					homepage_url: i.homepage,
					description: i.discription,
					//readme: i.,
					license_key: i.license.id,
					license_name: i.license.name,
					license_short: i.license.spdx_id,
					license_url: i.license.url, //Needs changing to the repo License, rather than the Github version
					plugincreated: i.created_at,
					pluginupdated: i.updated_at
				}, {
					upsert: true,
					new: false
				});
			}
			catch (err) {
				util.log('Error: %s', err);
			}

			util.log('id: %s | %s has been saved', i.id, i.name);
		}
	}
	catch (err)	{
		util.log('Error: %s', err);
	}
})();

new cronjob({
	cronTime: '0 * * * *',
	onTick: function() {

	},
	start: true,
	timeZone: 'Europe/London'
});
