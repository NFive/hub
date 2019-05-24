const config = require('config');
const unparsed = require('koa-body/unparsed.js');
const yaml = require('js-yaml');
const marked = require('marked');
const Plugins = require('../models/plugins');
const { App } = require('@octokit/app');
const Webhooks = require('@octokit/webhooks');
const Octokit = require('@octokit/rest');

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

	const latestRelease = await client.repos.getLatestRelease({
		owner: repo.owner,
		repo: repo.repo
	});

	if (!latestRelease) {
		throw new Error(`${repo.owner}/${repo.repo} has no release, no update occurred`);
	}

	var yml = await client.repos.getContents({
		owner: repo.owner,
		repo: repo.repo,
		path: 'nfive.yml',
		ref: latestRelease.data.tag_name
	});

	if (!yml) {
		throw new Error(`${repo.owner}/${repo.repo} error with nfive.yml, no update occurred`);
	}

	const definition = yaml.safeLoad(Buffer.from(yml.data.content, 'base64').toString('utf8'), 'utf8', { json: true });

	var readme = await client.repos.getReadme({
		owner: repo.owner,
		repo: repo.repo,
		ref: latestRelease.data.tag_name
	});

	if (!readme) {
		throw new Error(`${repo.owner}/${repo.repo} missing README, no update occurred`);
	}

	if (latestRelease.data.tag_name != definition.version) {
		throw new Error(`${repo.owner}/${repo.repo} version doesn't match, no update occurred`);
	}

	await Plugins.create({
		gh_id: repo.id,
		owner: definition.name.split('/')[0],
		project: definition.name.split('/')[1],
		description: definition.description,
		releases: [{
			version: definition.version,
			download_url: latestRelease.data.assets[0].browser_download_url,
			notes: latestRelease.data.body,
			readme: marked(Buffer.from(readme.data.content, 'base64').toString('binary'))
			//dependencies: dependencies, //Todo
		}],
		license: definition.license
	});

	console.log(`${repo.owner}/${repo.repo} created`);
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
