const router = require('koa-router')()
const config = require('config')
const users = require('./controller/user')
const repos = require('./controller/repo')

router
	.get('/', async (ctx) => {
		await ctx.render('index', {
			pretty: config.prettyHtml,
			title: config.name,
			url: ctx.request.origin,
		});
	})
	.get('/:user', users.view)
	.get('/:user/:repo', repos.view);

module.exports = router;