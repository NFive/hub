const config = require('config');
const util = require('util');
const mongoose = require('mongoose');

module.exports = () => {
	mongoose.Promise = global.Promise;

	mongoose.connection.on('open', util.log.bind(util, 'MongoDB connection open'));
	mongoose.connection.on('disconnected', util.log.bind(util, 'MongoDB connection disconnected'));
	mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

	mongoose.set('useCreateIndex', true);
	mongoose.set('useFindAndModify', false);
	//mongoose.set('debug', true);

	mongoose.connect(`mongodb://${config.database.host}/${config.database.db}`, { useNewUrlParser: true });

	return mongoose.connection;
};
