
const config = require('config');
const app = require('./app');
require('./db')();

module.exports = app.listen(process.env.PORT || config.port || 3000, function() {
	console.log('Server started: http://localhost:%s/', this.address().port);
});
