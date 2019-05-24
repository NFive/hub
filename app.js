const config = require('config');

const koa = require('koa');
const app = new koa();
const Webhooks = require('@octokit/webhooks')
const webhooks = new Webhooks({
    secret: config.github.secret
})
const router = require('./router');
const octicons = require('octicons');

app.keys = config.keys;
app.proxy = true;

app.use(require('koa-body')({
	includeUnparsed: true
}));
if (process.env.JEST_WORKER_ID == undefined) app.use(require('koa-logger')());
app.use(require('koa-compress')());
app.use(require('koa-json')());
app.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		if (ctx.url.startsWith('/api/')) {
			ctx.status = err.status || 500;
			ctx.type = 'json';

			ctx.body = {
				error: err
			};
		}

		ctx.app.emit('error', err, ctx);
	}
});
app.use(require('koa-static-cache')('./public', {
	maxAge: config.cacheAge
}));
app.use(require('koa-views')(__dirname + '/views', {
	extension: 'pug',
	options: {
		filters: {
			icon: (content, opts) => {
				return octicons[content].toSVG({ width: opts.size });
			}
		}
	}
}));

app.use(router.routes(), router.allowedMethods());

module.exports = app;
