const router = require('koa-router')();
const config = require('config');
const search = require('./controllers/search');
const orgs = require('./controllers/orgs');
const projects = require('./controllers/projects');

router
	.get('/', async ctx => {
		await ctx.render('index', {
			pretty: config.prettyHtml,
			title: config.name
		});
	})
	.get('/search', search.view)
	.get('/search.json', search.json)
	.get('/:org', orgs.view)
	.get('/:org/:project', projects.view);

module.exports = router;
