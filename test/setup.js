require('jest-extended');
const config = require('config');
const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);

beforeEach(async () => {
	await mongoose.connect(`mongodb://${config.database.host}/${process.env.TEST_SUITE}`, { useNewUrlParser: true });
	await mongoose.connection.dropDatabase();
});

afterEach(async () => {
	await mongoose.connection.dropDatabase();
	await mongoose.disconnect();
});
