const app = require('./app');
const config = require('config');
const util = require('util');

module.exports = app.listen(process.env.PORT || config.port || 3000, function() {
	util.log('[NFive] Server started: http://localhost:%s/', this.address().port);
});
