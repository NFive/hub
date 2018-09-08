const cronjob = require('cron').CronJob;
const rest = require('@octokit/rest');
const github = new rest();
const Plugins = require('../models/plugins');
const util = require('util');
const fetch = require('node-fetch');
const marked = require('marked');

(async () => {
	try {
		github.authenticate({
			type: 'oauth',
			token: '1b01a00c5b950b472e444079b7e8363fe57429ab' // Put in config | Yeah just testing if it works, wasn't going to push it.
		});

		const result = await github.search.repos({ q: 'topic:nfive-plugin' });

		for (let i of result.data.items) {
			try {
				let releases = await github.repos.getReleases({ owner: i.owner.login, repo: i.name, per_page: '100', page: '1' });
				releases = releases.data.filter(r => !r.draft && !r.prerelease);
				releases = await Promise.all(releases.map(async r => {
					let readme = await github.repos.getReadme({ owner: i.owner.login, repo: i.name, ref: r.tag_name });
					readme = await fetch(readme.data.download_url);

					return {
						tag: r.tag_name,
						created: r.published_at,
						notes: marked(r.body),
						downloads: r.assets[0].download_count,
						readme: marked(await readme.text())
					};
				}));

				await Plugins.findOneAndUpdate({ gh_id: i.id }, {
					gh_id: i.id,
					org: i.owner.login,
					project: i.name,
					avatar_url: i.owner.avatar_url,
					homepage_url: i.homepage,
					description: i.description,
					releases: releases,
					counts: {
						stars: i.stargazers_count,
						watchers: i.watchers_count,
						forks: i.forks_count,
						issues: i.open_issues_count
					},
					license: i.license.key,
					created: i.created_at
				}, {
					upsert: true,
					setDefaultsOnInsert: true
				});
			}
			catch (err) {
				util.log('Error: %s', err);
			}

			util.log('id: %s | %s has been saved', i.id, i.name);
		}
	}
	catch (err) {
		util.log('Error: %s', err);
	}
})();

new cronjob({
	cronTime: '0 * * * *',
	onTick: function () {

	},
	start: true,
	timeZone: 'Europe/London'
});
