const cronjob = require('cron').CronJob;
const config = require('config');
const rest = require('@octokit/rest');
const github = new rest();
const Plugins = require('../models/plugins');
const util = require('util');
const fetch = require('node-fetch');
const marked = require('marked');

const update = async () => {
	try {
		github.authenticate({
			type: config.github.type,
			token: config.github.token
		});

		const result = await github.search.repos({ q: 'topic:nfive-plugin' });

		for (let i of result.data.items) {
			let readme;

			try {
				let releases = await github.repos.getReleases({ owner: i.owner.login, repo: i.name, per_page: '100', page: '1' });
				releases = releases.data.filter(r => !r.draft && !r.prerelease);
				releases = await Promise.all(releases.map(async r => {
					readme = await github.repos.getReadme({ owner: i.owner.login, repo: i.name, ref: r.tag_name });
					readme = await fetch(readme.data.download_url);

					return {
						tag: r.tag_name,
						downloads: r.assets[0].download_count,
						notes: marked(r.body),
						readme: marked(await readme.text()),
						created: r.published_at
					};
				}));

				if (releases && releases.length) {
					readme = await github.repos.getReadme({ owner: i.owner.login, repo: i.name});
					readme = await fetch(readme.data.download_url);
					readme = marked(await readme.text());
				}

				await Plugins.findOneAndUpdate({ gh_id: i.id }, {
					gh_id: i.id,
					org: i.owner.login,
					project: i.name,
					avatar_url: i.owner.avatar_url,
					homepage_url: i.homepage,
					description: i.description,
					counts: {
						stars: i.stargazers_count,
						watchers: i.watchers_count,
						forks: i.forks_count,
						issues: i.open_issues_count
					},
					releases: releases,
					readme: readme,
					license: i.license.key,
					created: i.created_at
				}, {
					upsert: true,
					setDefaultsOnInsert: true
				});
				util.log('id: %s | %s has been saved', i.id, i.name);

			}
			catch (err) {
				util.log('Error: %s', err);
			}
		}

	} catch (err) {
		util.log('Update Error: %s', err);
	}
};

const cleanup = async () => {
	try{
		const cutoff = new Date();
		await Plugins.deleteMany({
			scraped: {$lte: cutoff.setDate(cutoff.getDate()-5)}
		});
	} catch (err) {
		util.log('Cleanup Error: %s', err);
	}
};

new cronjob({
	cronTime: '0 * * * *',
	onTick: function () {
		console.log(Date.now() + " | Starting Database Update....")
		update();
		cleanup();
		console.log(Date.now() + " | Database Update Completed")
	},
	start: true,
	timeZone: 'Europe/London'
});
