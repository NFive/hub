const koa = require('koa');
const app = new koa();
const config = require('config');
const router = require('./router');
const octicons = require("octicons");
require('./db')();
require('./controllers/github');

app.keys = config.keys;
app.proxy = true;

if (process.env.JEST_WORKER_ID == undefined) app.use(require('koa-logger')());
app.use(require('koa-compress')());
app.use(require('koa-json')());
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
