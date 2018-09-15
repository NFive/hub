const router = require('koa-router')();
const config = require('config');
const index = require('./controllers/index');
const search = require('./controllers/search');
const orgs = require('./controllers/orgs');
const projects = require('./controllers/projects');

router
	.get('/', index.view)
	// .get('/', async ctx => {
	// 	await ctx.render('index', {
	// 		pretty: config.prettyHtml,
	// 		title: config.name,
	// 		test: Plugins
	// 	});
	// })
	.get('/search', search.view)
	.get('/search.json', search.json)
	.get('/:org', orgs.view)
	.get('/:org/:project.json', projects.json)
	.get('/:org/:project([^@/]+)', projects.view)
	.get('/:org/:project([^@/]+)@:version', projects.view)

module.exports = router;
