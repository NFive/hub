const supertest = require('supertest');
const app = require('../app');
const Plugins = require('../models/plugins');

process.env.TEST_SUITE = 'api';

describe('api', () => {
	const request = supertest(app.listen());

	describe('GET /api', () => {
		it('<200> should always return with the API route information', async () => {
			const res = await request
				.get('/api')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200);

			const { owner, project, version } = res.body;

			expect(owner).toEndWith('/api/owner/{owner}');
			expect(project).toEndWith('/api/project/{owner}/{project}');
			expect(version).toEndWith('/api/version/{owner}/{project}/{version}');
		});
	});

	describe('GET /api/owner/:owner.json', () => {
		it('<404> should return error for missing owner', async () => {
			const res = await request
				.get('/api/owner/non-existant.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(404);

			const { error } = res.body;

			expect(error.owner).toBe('non-existant');
		});

		it('<200> should return matched owner', async () => {
			const plugin = new Plugins({
				'gh_id': 147707025,
				'avatar_url': 'https://avatars1.githubusercontent.com/u/40443230?v=4',
				'counts': {
					'stars': 1,
					'watchers': 1,
					'forks': 1,
					'issues': 1
				},
				'created': Date('2018-09-06T17:09:07.000Z'),
				'description': 'Basic FiveM loading screen as a NFive plugin',
				'homepage_url': '',
				'license': 'lgpl-3.0',
				'owner': 'NFive',
				'project': 'plugin-loadingscreen',
				'readme': '<h1 id=\'readme-nfive-loading-screen\'>NFive Loading Screen</h1>\n',
				'releases': [
					{
						'tag': '1.0.0',
						'downloads': 117,
						'download_url': 'https://github.com/NFive/plugin-loadingscreen/releases/download/1.0.0/plugin-loadingscreen.zip',
						'notes': '<p>Initial release</p>\n',
						'readme': '<h1 id=\'readme-nfive-loading-screen\'>NFive Loading Screen</h1>\n',
						'created': Date('2018-09-06T17:22:25.000Z')
					}
				]
			});

			await plugin.save();

			await request
				.get('/api/owner/NFive.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200);
		});
	});
});
