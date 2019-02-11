const cronjob = require('cron').CronJob
const config = require('config')
const Octokit = require('@octokit/rest')
const github = new Octokit({
	auth: `token ${config.github.token}`
})
const Plugins = require('../models/plugins')
const util = require('util')
const fetch = require('node-fetch')
const marked = require('marked')
const sanitizer = require('marked-sanitizer-github').default
const yaml = require('js-yaml')

marked.setOptions({
	headerPrefix: 'readme-',
	sanitize: true,
	sanitizer: new sanitizer().getSanitizer()
})

new cronjob({
	start: true,
	timeZone: 'Etc/UTC',
	cronTime: '0 * * * *',
	onTick: async () => {
		await update()
		await cleanup()
	}
})

const update = async () => {
	util.log('Starting database update....')
	try {
		// Get ratelimit for debug purposes
		var rateLimit = await github.rateLimit.get({})
		util.log(`Limit: ${rateLimit.data.rate.limit} | Remaining: ${rateLimit.data.rate.remaining}`)

		// Return all plugins with matching tag
		let result = await github.search.repos({ q: 'topic:nfive-plugin', per_page: 100 });

		// Loop all returned results to gather info before storing in the database
		for (let i of result.data.items) {
			const options = await github.repos.listReleases.endpoint.merge({ owner: i.owner.login, repo: i.name, per_page: 100 })
			let releases = await page(options)
			releases = await releases.filter(r => !r.draft && !r.prerelease)

			releases = await Promise.all(
				releases.map(async r => {
					let dependencies = []
					let compatible = false
					let readme = null

					try {
						var nfiveyml = await github.repos.getContents({
							owner: i.owner.login,
							repo: i.name,
							path: 'nfive.yml',
							ref: r.tag_name
						})

						nfiveyml = await Buffer.from(nfiveyml.data.content, 'base64').toString('utf8')
						nfiveyml = await yaml.safeLoad(nfiveyml, 'utf8', { json: true })

						if (nfiveyml.dependencies && util.isArray(nfiveyml.dependencies)) {
							await nfiveyml.dependencies.map(async dependency => {
								await Object.keys(dependency).forEach(async key => {
									await dependencies.push({
										plugin: key,
										version: dependency[key]
									})
								})
							})
						} else if (nfiveyml.dependencies) {
							Object.keys(nfiveyml.dependencies).forEach(async key => {
								await dependencies.push({
									plugin: key,
									version: nfiveyml.dependencies[key]
								})
							})
						}

						compatible = true
					} catch (ex) {
						//console.log(ex)
					}

					try {
						readme = await github.repos.getReadme({
							owner: i.owner.login,
							repo: i.name,
							ref: r.tag_name
						})

						readme = await fetch(readme.data.download_url)
						readme = await marked(await readme.text())
					} catch (ex) {
						//console.log(ex)
					}

					return {
						tag: r.tag_name,
						downloads: r.assets[0].download_count,
						download_url: r.assets[0].browser_download_url,
						notes: marked(r.body),
						readme: readme,
						compatible: compatible,
						dependencies: dependencies,
						created: r.published_at
					}
				})
			)

			// Grab the readme from the latest release, if there is a release.
			let readme
			if (releases && releases.length) {
				try {
					readme = await github.repos.getReadme({
						owner: i.owner.login,
						repo: i.name
					})

					readme = await fetch(readme.data.download_url)
					readme = await marked(await readme.text())
				} catch (ex) { }
			}

			// Set license if one isn't set via the project
			if (i.license == null || i.license.key === undefined) {
				i.license = { key: 'unknown' };
			}

			// Store Plugin in Database
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
			)
			util.log('id: %s | %s/%s has been saved', i.id, i.owner.login, i.name)
		}
		rateLimit = await github.rateLimit.get({})
		util.log('Limit: %s | Remaining: %s', rateLimit.data.rate.limit, rateLimit.data.rate.remaining)
	} catch (err) {
		util.log('Update Error: %s', err)
	}
}

const cleanup = async () => {
	util.log('Starting database cleanup...')
	try {

		// Set the cutoff date to 5 days from now
		const cutoff = new Date()
		cutoff.setDate(cutoff.getDate() - 5)

		// Find all plugins that haven't been scraped since the cutoff date
		const removals = await Plugins.find({
			scraped: { $lte: cutoff }
		})

		// Delete all plugins that haven't been scraped since the cutoff date
		await Plugins.deleteMany({
			scraped: { $lte: cutoff }
		})

		// Log plugins that were removed
		for (let i of removals) {
			util.log('id: %s | %s has been removed', i.gh_id, i.name)
		}

	} catch (err) {
		util.log('Cleanup Error: %s', err)
	}
}

const page = async (options) => {
	const results = []

	for await (const response of github.paginate.iterator(options)) {
		results.push(...response.data)
	}

	return results
}

// Uncomment to run and update on startup (For testing)
//(async () => { await update() })()