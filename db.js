const config = require('config');
const mongoose = require('mongoose');

module.exports = () => {
	mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

	mongoose.connect(`mongodb://${config.database.host}/${config.database.db}`, {
		useCreateIndex: true,
		useNewUrlParser: true
	});

	return mongoose.connection;
};
