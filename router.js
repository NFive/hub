const router = require('koa-router')();
const index = require('./controllers/index');
const search = require('./controllers/search');
const owners = require('./controllers/owners');
const projects = require('./controllers/projects');

router
	.get('/', index.view)
	.get('/search', search.view)
	.get('/search.json', search.json)
	.get('/:owner', owners.view)
	.get('/:owner/:project.json', projects.json)
	.get('/:owner/:project([^@/]+)', projects.view)
	.get('/:owner/:project([^@/]+)@:version', projects.view)

module.exports = router;
