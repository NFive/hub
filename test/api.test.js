/* eslint-env jest */
'use strict';

const supertest = require('supertest');
const app = require('../app');

describe('api', () => {
	const request = supertest(app.listen());

	describe('GET /api', () => {
		it('<200> should always return with the API route information', async () => {
			const res = await request
				.get('/api')
				.expect('Content-Type', /json/)
				.expect(200);

			const { owner, project, version } = res.body;

			expect(owner).toEndWith('/api/owner/{owner}');
			expect(project).toEndWith('/api/project/{owner}/{project}');
			expect(version).toEndWith('/api/version/{owner}/{project}/{version}');
		});
	});
});
