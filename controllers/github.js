/* eslint-disable require-atomic-updates */
const config = require('config');
const unparsed = require('koa-body/unparsed.js');
const yaml = require('js-yaml');
const marked = require('marked');
const Plugins = require('../models/plugins');
const { App } = require('@octokit/app');
const Webhooks = require('@octokit/webhooks');
const Octokit = require('@octokit/rest');
const semver = require('semver');
const util = require('util');

const app = new App({
	id: config.github.appId,
	privateKey: config.github.key
});

const webhooks = new Webhooks({
	secret: config.github.secret
	// log: {
	// 	debug: console.debug,
	// 	info: console.info,
	// 	warn: console.warn,
	// 	error: console.error
	// }
});

const createPlugin = async (data) => {
	const repo = {
		id: data.repositories[0].id,
		owner: data.repositories[0].full_name.split('/')[0],
		project: data.repositories[0].full_name.split('/')[1]
	};

	// This is how we get an repo installation ID, but we already have it here from the event:
	// const appClient = new Octokit({
	// 	auth: `Bearer ${app.getSignedJsonWebToken()}`
	// });

	// const installation = await appClient.apps.getRepoInstallation({
	// 	owner: repo.owner,
	// 	repo: repo.project
	// });

	// console.log(installation.data.id);

	const client = new Octokit({
		auth: `token ${await app.getInstallationAccessToken({ installationId: data.installation.id })}`
	});

	let releases = await client.repos.listReleases({
		owner: repo.owner,
		repo: repo.project
	});

	const project = await client.repos.get({
		owner: repo.owner,
		repo: repo.project
	});

	if (releases.data.length < 1) {
		throw new Error(`${repo.owner}/${repo.project} has no release, no update occurred`);
	}
	if (project == null) {
		throw new Error(`Unable to get ${repo.owner}/${repo.project} details, no update occurred`);
	}

	let validReleases = [];
	for (var release of releases.data) {
		const result = await validateReleases(client, repo, release);
		if (result) validReleases.push(result);
	}
	if (validReleases.length < 1) {
		throw new Error(`${repo.owner}/${repo.project} has no valid releases, no update occurred`);
	}
	validReleases = validReleases.sort((a, b) => semver.compare(a.definition.version, b.definition.version));

	await Plugins.create({
		gh_id: repo.id,
		install_id: data.installation.id,
		owner: repo.owner,
		project: repo.project,
		description: validReleases[validReleases.length - 1].definition.description,
		avatar_url: project.data.owner.avatar_url,
		counts: {
			stars: project.data.stargazers_count,
			watchers: project.data.watchers_count,
			forks: project.data.forks_count,
			issues: project.data.open_issues_count
		},
		releases: validReleases.map(r => {
			return {
				version: r.definition.version,
				download_url: r.assets[0].browser_download_url,
				downloads: r.assets[0].download_count,
				notes: r.body,
				readme: r.readme,
				dependencies: r.dependencies,
				createdAt: r.published_at
			};
		}),
		license: validReleases[validReleases.length - 1].definition.license,
		createdAt: project.data.created_at
	});

	console.log(`${repo.owner}/${repo.project} created`);
};

const deletePlugin = async (data) => {
	const repo = {
		id: data.repository.id,
		owner: data.repository.full_name.split('/')[0],
		project: data.repository.full_name.split('/')[1]
	};

	await Plugins.findOneAndUpdate(
		{ install_id: data.installation.id },
		{
			$set: {
				deletedAt: Date.now()
			}
		}
	);
	console.log(`${repo.owner}/${repo.project} deleted.`);
};

const updatePlugin = async (data) => {
	const repo = {
		id: data.repository.id,
		owner: data.repository.full_name.split('/')[0],
		project: data.repository.full_name.split('/')[1]
	};

	const client = new Octokit({
		auth: `token ${await app.getInstallationAccessToken({installationId: data.installation.id})}`
	});

	const project = await client.repos.get({
		owner: repo.owner,
		repo: repo.project
	});

	if (project == null) {
		throw new Error(`Unable to get ${repo.owner}/${repo.project} details, no update occurred`);
	}

	const release = await validateReleases(client, repo, data.release);

	if (!release) {
		throw new Error(`${repo.owner}/${repo.project} release isn't valid, no update occurred`);
	}

	await Plugins.findOneAndUpdate(
		{ gh_id: repo.id },
		{
			$push: {
				releases: {
					version: release.version,
					download_url: release.assets[0].browser_download_url,
					downloads: release.assets[0].download_count,
					notes: release.body,
					readme: release.readme,
					dependencies: release.dependencies,
					createdAt: release.published_at
				}
			},
			$set: {
				owner: repo.owner,
				project: repo.project,
				description: release.definition.description,
				avatar_url: project.data.owner.avatar_url,
				counts: {
					stars: project.data.stargazers_count,
					watchers: project.data.watchers_count,
					forks: project.data.forks_count,
					issues: project.data.open_issues_count
				},
				license: release.definition.license,
				updatedAt: project.data.updated_at
			}
		}, {
			upsert: true
		}
	);

	console.log(`${repo.owner}/${repo.project} updated, ${data.release.tag_name} added to releases`);
};

const deleteRelease = async (data) => {
	const repo = {
		id: data.repository.id,
		owner: data.repository.full_name.split('/')[0],
		project: data.repository.full_name.split('/')[1]
	};

	const client = new Octokit({
		auth: `token ${await app.getInstallationAccessToken({installationId: data.installation.id})}`
	});

	const release = await validateReleases(client, repo, data.release);

	if (!release) {
		throw new Error(`${repo.owner}/${repo.project} release(${data.release.tag_name}) isn't valid, no deletion occurred`);
	}

	await Plugins.findOneAndUpdate({
		'install_id': data.installation.id,
		'releases.version': release.tag_name
	},
	{
		$set: {
			'releases.$.deletedAt': Date.now()
		}
	}, {
		upsert: true
	});
};

const validateReleases = async (client, repo, release) => {
	if (release.draft) return null;
	if (release.prerelease) return null;

	release.definition = await getDefinition(client, repo, release.tag_name);

	if (release.definition === null) return null;
	if (repo.owner !== release.definition.name.split('/')[0]) return null;
	if (repo.project !== release.definition.name.split('/')[1]) return null;
	if (release.tag_name !== release.definition.version) return null;

	release.readme = await getReadme(client, repo, release.tag_name);

	release.dependencies = await getDependencies(release.definition.dependencies);

	return release;
};

const getDefinition = async (client, repo, ref) => {
	const definition = await client.repos.getContents({
		owner: repo.owner,
		repo: repo.project,
		path: 'nfive.yml',
		ref: ref
	});

	if (!definition) return null;

	return yaml.safeLoad(Buffer.from(definition.data.content, 'base64').toString('utf8'));
};

const getReadme = async (client, repo, ref) => {
	const readme = await client.repos.getReadme({
		owner: repo.owner,
		repo: repo.project,
		ref: ref
	});

	if (!readme) return null;

	return marked(Buffer.from(readme.data.content, 'base64').toString('utf8'));
};

const getDependencies = async (dependencies) => {
	var output = [];

	if (dependencies && util.isArray(dependencies)) {
		await dependencies.map(async dependency => {
			await Object.keys(dependency).forEach(async key => {
				await output.push({
					plugin: key,
					version: dependency[key]
				});
			});
		});
	} else if (dependencies) {
		Object.keys(dependencies).forEach(async key => {
			await output.push({
				plugin: key,
				version: dependencies[key]
			});
		});
	}

	return output;
};

webhooks.on('ping', async ({ id, name, payload }) => {
	console.log(`[${id} | ${name}] received "${payload.zen}"`);
});

webhooks.on('installation.created', async ({ id, name, payload }) => {
	console.log(`[${id} | ${name}] action "${payload.action}" on "${payload.repositories[0].full_name}" with installation ID ${payload.installation.id}`);
	await createPlugin(payload);
});

webhooks.on('installation.deleted', async ({ id, name, payload }) => {
	console.log(`[${id} | ${name}] action "${payload.action}" on installation ID ${payload.installation.id}`);
	await deletePlugin(payload);
});

webhooks.on('release.published', async ({ id, name, payload }) => {
	console.log(`[${id} | ${name}] action "${payload.action}" on "${payload.repository.full_name}"`);
	await updatePlugin(payload);
});

webhooks.on('release.edited', async ({ id, name, payload }) => {
	console.log(`[${id} | ${name}] action "${payload.action}" on "${payload.repository.full_name}"`);
	await updatePlugin(payload);
});

webhooks.on('release.deleted', async ({ id, name, payload }) => {
	console.log(`[${id} | ${name}] action "${payload.action}" on "${payload.repository.full_name}"`);
	await deleteRelease(payload);
});

exports.webhooks = async (ctx) => {
	try {
		await webhooks.verifyAndReceive({
			id: ctx.request.headers['x-github-delivery'],
			name: ctx.request.headers['x-github-event'],
			signature: ctx.request.header['x-hub-signature'],
			payload: JSON.parse(ctx.request.body[unparsed])
		});

		ctx.status = 200;
	}
	catch (ex) {
		ctx.status = 500;

		console.error(ex.errors[0]);
	}
};
