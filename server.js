
const config = require('config');
const util = require('util');
const app = require('./app');
require('./db')();

module.exports = app.listen(process.env.PORT || config.port || 3000, function() {
	util.log('Server started: http://localhost:%s/', this.address().port);
});
