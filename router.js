const router = require('koa-router')();
const index = require('./controllers/index');
const search = require('./controllers/search');
const api = require('./controllers/api');
const owners = require('./controllers/owners');
const projects = require('./controllers/projects');

router
	.get('/', index.view)
	.get('/search', search.view)

	.get('/api', api.index)
	.get('/api/search.json', api.search)
	.get('/api/owner/:owner.json', api.owner)
	.get('/api/project/:owner/:project.json', api.project)
	.get('/api/version/:owner/:project/:version.json', api.version)

	.get('/:owner', owners.view)
	.get('/:owner/:project([^@/]+)', projects.view)
	.get('/:owner/:project([^@/]+)@:version', projects.view);

module.exports = router;
