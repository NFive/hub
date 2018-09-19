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
			await request
				.get('/api/owner/NFive.json')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200);
		});
	});
});
