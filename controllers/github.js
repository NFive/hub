const cronjob = require('cron').CronJob;
const config = require('config');
const rest = require('@octokit/rest');
const github = new rest();
const Plugins = require('../models/plugins');
const util = require('util');
const fetch = require('node-fetch');
const marked = require('marked');
const sanitizer = require('marked-sanitizer-github').default;

marked.setOptions({
	headerPrefix: 'readme-',
	sanitize: true,
	sanitizer: new sanitizer().getSanitizer()
});

new cronjob({
	start: true,
	timeZone: 'Etc/UTC',
	cronTime: '0 * * * *',
	onTick: async () => {
		await update();
		await cleanup();
	}
});

const update = async () => {
	util.log('Starting database update....');
	try {
		if (config.github.token) {
			github.authenticate({
				type: config.github.type,
				token: config.github.token
			});
		}

		var rateLimit = await github.misc.getRateLimit();
		util.log('Limit: %s | Remaining: %s', rateLimit.data.rate.limit, rateLimit.data.rate.remaining);

		const result = await github.search.repos({ q: 'topic:nfive-plugin' });

		for (let i of result.data.items) {
			let readme;

			try {
				let releases = await paginate(github.repos.getReleases, { owner: i.owner.login, repo: i.name, per_page: 100 });

				releases = await releases.filter(r => !r.draft && !r.prerelease);

				releases = await Promise.all(
					releases.map(async r => {
						readme = await github.repos.getReadme({
							owner: i.owner.login,
							repo: i.name,
							ref: r.tag_name
						});
						readme = await fetch(readme.data.download_url);

						return {
							tag: r.tag_name,
							downloads: r.assets[0].download_count,
							download_url: r.assets[0].browser_download_url,
							notes: marked(r.body),
							readme: marked(await readme.text()),
							created: r.published_at
						};
					})
				);

				if (releases && releases.length) {
					readme = await github.repos.getReadme({
						owner: i.owner.login,
						repo: i.name
					});
					readme = await fetch(readme.data.download_url);
					readme = marked(await readme.text());
				}

				await Plugins.findOneAndUpdate({ gh_id: i.id },
					{
						gh_id: i.id,
						owner: i.owner.login,
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
						created: i.created_at,
						scraped: Date.now()
					},
					{
						upsert: true,
						setDefaultsOnInsert: true
					}
				);

				util.log('id: %s | %s/%s has been saved', i.id, i.owner.login, i.name);
			} catch (err) {
				util.log('Error: %s', err);
			}
		}
		rateLimit = await github.misc.getRateLimit();
		util.log('Limit: %s | Remaining: %s', rateLimit.data.rate.limit, rateLimit.data.rate.remaining);
	} catch (err) {
		util.log('Update Error: %s', err);
	}
};

const cleanup = async () => {
	util.log('Starting database cleanup...');
	try {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - 5)

		const removals = await Plugins.find({
			scraped: { $lte: cutoff }
		});

		await Plugins.deleteMany({
			scraped: { $lte: cutoff }
		});

		for (let i of removals) {
			util.log('id: %s | %s has been removed', i.gh_id, i.name);
		}

	} catch (err) {
		util.log('Cleanup Error: %s', err);
	}
};

let paginate = async (method, args) => {
	try {
		let response = await method(args);
		let { data } = response;

		while (github.hasNextPage(response)) {
			response = await github.getNextPage(response);
			data = data.concat(response.data);
		}

		return data;
	} catch (err) {
		util.log('Paginate Error: %s', err);
	}
};
