const config = require('config');
const util = require('util');

exports.show = async (ctx, error) => {
	try {
		return await ctx.render('error', {
			pretty: config.prettyHtml,
			title: config.name,
			error: error
		});
	} catch (ex) {
		util.log(ex);
	}
};
