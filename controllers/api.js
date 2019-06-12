const Plugins = require('../models/plugins');

module.exports = {
	async index(ctx) {
		ctx.body = {
			owner: 'https://hub.nfive.io/api/owner/{owner}',
			project: 'https://hub.nfive.io/api/project/{owner}/{project}',
			version: 'https://hub.nfive.io/api/version/{owner}/{project}/{version}'
		};
	},

	async search(ctx) {
		if (ctx.query.q == undefined) return ctx.throw(404, 'search query not provided', {
			missing: 'q'
		});

		const perPage = 15;
		let page = 1;

		if (ctx.query.page) {
			page = Number(ctx.query.page);
		}

		if (!Number.isInteger(page)) return ctx.throw(404, 'bad page number requested', {
			page: ctx.query.page
		});

		const totalResults = await Plugins.countDocuments(
			{
				$text: {
					$search: ctx.query.q
				}
			}
		);

		const totalPages = Math.max(1, Math.ceil(totalResults / perPage));

		if (page < 1 || page > totalPages) return ctx.throw(404, 'invalid page number requested', {
			page: page
		});

		const results = (await Plugins.find({
			$text: {
				$search: ctx.query.q
			}
		}, {
			score: {
				$meta: 'textScore'
			}
		}, {
			skip: perPage * (page - 1),
			limit: perPage
		}).sort({
			score: {
				$meta: 'textScore'
			}
		})).filter(r => r.has_release);

		ctx.body = {
			results: results.map(r => {
				return {
					name: r.name,
					owner: r.owner,
					gh_url: r.gh_url,
					license: r.license,
					downloads: r.project_downloads,
					description: r.description,
					readme: r.readme,
					versions: r.releases.map(p => {
						return {
							version: p.version,
							download_url: p.download_url
						};
					}),
					scraped: r.scraped
				};
			}),
			count: {
				total: totalResults,
				page: page,
				total_pages: totalPages
			}
		};
	},

	async owner(ctx) {
		const owner = await Plugins.findOne({ owner: ctx.params.owner });

		if (owner == null) return ctx.throw(404, 'owner not found', {
			owner: ctx.params.owner
		});

		ctx.body = {
			name: owner.owner,
			avatar: owner.avatar_url,
			gh_url: 'https://github.com/' + owner.owner,
			scraped: owner.scraped
		};
	},

	async project(ctx) {
		const project = await Plugins.findOne({ owner: ctx.params.owner, project: ctx.params.project });
		if (project == null) return ctx.throw(404, 'project not found', {
			owner: ctx.params.owner,
			project: ctx.params.project
		});

		ctx.body = {
			name: project.name,
			owner: project.owner,
			gh_url: project.gh_url,
			license: project.license,
			downloads: project.project_downloads,
			description: project.description,
			readme: project.readme,
			versions: project.releases.map(p => {
				return {
					version: p.version,
					download_url: p.download_url,
					dependencies: p.dependencies
				};
			}),
			scraped: project.scraped
		};
	},

	async version(ctx) {
		const version = await Plugins.findOne({ owner: ctx.params.owner, project: ctx.params.project, 'releases.version': ctx.params.version });
		if (version == null) return ctx.throw(404, 'version not found', {
			owner: ctx.params.owner,
			project: ctx.params.project,
			version: ctx.params.version
		});

		version.release = version.releases.filter(r => r.version == ctx.params.version)[0];

		ctx.body = {
			name: version.name + '@' + version.release.version,
			owner: version.owner,
			project: version.project,
			license: version.release.license, // TODO
			downloads: version.release.downloads,
			notes: version.release.readme,
			readme: version.release.readme,
			download_url: version.release.download_url,
			published: version.release.created,
			scraped: version.scraped
		};
	}
};
