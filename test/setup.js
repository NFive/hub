require('jest-extended');
const config = require('config');
const mongoose = require('mongoose');
const Plugins = require('../models/plugins');
const data = require('./seed');

mongoose.set('useCreateIndex', true);

beforeEach(async () => {
	await mongoose.connect(`mongodb://${config.database.host}/${process.env.TEST_SUITE}`, { useNewUrlParser: true });
	await mongoose.connection.dropDatabase();

	for (const plugin of data) {
		await new Plugins(plugin).save();
	}

	await Plugins.ensureIndexes();
});

afterEach(async () => {
	await mongoose.connection.dropDatabase();
	await mongoose.disconnect();
});
