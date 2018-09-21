const supertest = require('supertest');
const app = require('../app');

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

	describe('GET /api/search.json', () => {
		it('<404> should return error for missing query', async () => {
			const res = await request
				.get('/api/search.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(404);

			expect(res.body.error.missing).toBe('q');
		});

		it('<200> should return matched owner', async () => {
			await request
				.get('/api/search.json?q=nfive')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200);
		});
	});

	describe('GET /api/owner/:owner.json', () => {
		it('<404> should return error for missing owner', async () => {
			const res = await request
				.get('/api/owner/non-existant.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(404);

			expect(res.body.error.message).toBe('owner not found');
			expect(res.body.error.owner).toBe('non-existant');
		});

		it('<200> should return matched owner', async () => {
			const res = await request
				.get('/api/owner/NFive.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200);

			expect(res.body.name).toBe('NFive');
			expect(res.body.avatar).toBeString();
			expect(res.body.gh_url).toBeString();
			expect(await new Date(res.body.scraped)).toBeDate();
		});
	});

	describe('GET /api/project/:owner/:project.json', () => {
		it('<404> should return error for missing project', async () => {
			const res = await request
				.get('/api/project/NFive/non-existant.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(404);

			expect(res.body.error.owner).toBe('NFive');
			expect(res.body.error.project).toBe('non-existant');
		});

		it('<200> should return matched project', async () => {
			await request
				.get('/api/project/NFive/plugin-loadingscreen.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200);
		});
	});

	describe('GET /api/version/:owner/:project/:version.json', () => {
		it('<404> should return error for missing version', async () => {
			const res = await request
				.get('/api/version/NFive/plugin-loadingscreen/0.0.0.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(404);

			expect(res.body.error.owner).toBe('NFive');
			expect(res.body.error.project).toBe('plugin-loadingscreen');
			expect(res.body.error.version).toBe('0.0.0');
		});

		it('<200> should return matched version', async () => {
			await request
				.get('/api/version/NFive/plugin-loadingscreen/1.0.0.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200);
		});
	});
});
