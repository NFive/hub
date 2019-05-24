const config = require('config');
const unparsed = require('koa-body/unparsed.js');
const yaml = require('js-yaml');
const marked = require('marked');
const Plugins = require('../models/plugins');
const { App } = require('@octokit/app');
const Webhooks = require('@octokit/webhooks');
const Octokit = require('@octokit/rest');
const semver = require('semver');

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
		repo: data.repositories[0].full_name.split('/')[1]
	};


	// This is how we get an repo installation ID, but we already have it here from the event:
	// const appClient = new Octokit({
	// 	auth: `Bearer ${app.getSignedJsonWebToken()}`
	// });

	// const installation = await appClient.apps.getRepoInstallation({
	// 	owner: repo.owner,
	// 	repo: repo.repo
	// });

	// console.log(installation.data.id);


	const client = new Octokit({
		auth: `token ${await app.getInstallationAccessToken({
			installationId: data.installation.id
		})}`
	});

	let releases = await client.repos.listReleases({
		owner: repo.owner,
		repo: repo.repo
	});

	if (releases.data.length < 1) {
		throw new Error(`${repo.owner}/${repo.repo} has no release, no update occurred`);
	}

	let validReleases = [];

	for (var release of releases.data) {
		if (release.draft) continue;
		if (release.prerelease) continue;

		release.definition = await getDefinition(client, repo, release.tag_name);

		if (release.definition === null) continue;
		if (repo.owner !== release.definition.name.split('/')[0]) continue;
		if (repo.repo !== release.definition.name.split('/')[1]) continue;
		if (release.tag_name !== release.definition.version) continue;

		release.readme = await getReadme(client, repo, release.tag_name);

		validReleases.push(release);
	}

	validReleases = validReleases.sort((a, b) => semver.rcompare(a.definition.version, b.definition.version));

	if (validReleases.length < 1) {
		throw new Error(`${repo.owner}/${repo.repo} has no valid releases, no update occurred`);
	}

	await Plugins.create({
		gh_id: repo.id,
		owner: repo.owner,
		project: repo.repo,
		description: validReleases[0].definition.description,
		releases: validReleases.map(r => {
			return {
				version: r.definition.version,
				download_url: r.assets[0].browser_download_url,
				notes: r.body,
				readme: r.readme,
				dependencies: [] // TODO
			};
		}),
		license: validReleases[0].definition.license
	});

	console.log(`${repo.owner}/${repo.repo} created`);
};

const getDefinition = async (client, repo, ref) => {
	const definition = await client.repos.getContents({
		owner: repo.owner,
		repo: repo.repo,
		path: 'nfive.yml',
		ref: ref
	});

	if (!definition) return null;

	return yaml.safeLoad(Buffer.from(definition.data.content, 'base64').toString('utf8'));
};

const getReadme = async (client, repo, ref) => {
	const readme = await client.repos.getReadme({
		owner: repo.owner,
		repo: repo.repo,
		ref: ref
	});

	if (!readme) return null;

	return marked(Buffer.from(readme.data.content, 'base64').toString('utf8'));
};

webhooks.on('ping', async ({id, name, payload}) => {
	payload = await JSON.parse(payload);
	console.log(`[${id} ${name}] received "${payload.zen}"`);
});

webhooks.on('installation', async ({id, name, payload}) => {
	payload = await JSON.parse(payload);
	console.log(`[${id} ${name}] action "${payload.action}" on "${payload.repositories[0].full_name}" with installation ID ${payload.installation.id}`);

	await createPlugin(payload);
});

webhooks.on('release', async ({id, name, payload}) => {
	payload = await JSON.parse(payload);
	console.log(`[${id} ${name}] received "${payload.event.name} handler: ${payload.stack}"`);

	//await updatePlugin(payload);
});

exports.webhooks = async (ctx) => {
	try {
		await webhooks.verifyAndReceive({
			id: ctx.request.headers['x-github-delivery'],
			name: ctx.request.headers['x-github-event'],
			signature: ctx.request.header['x-hub-signature'],
			payload: ctx.request.body[unparsed]
		});

		ctx.status = 200;
	}
	catch (ex) {
		ctx.status = 500;

		console.error(ex.errors[0]);
	}
};
