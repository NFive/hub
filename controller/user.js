const config = require('config')
const user = require('../models/plugins')

module.exports = {
    async view(ctx) {
        try {
            let user = await user.findById(ctx.params.user).exec();

        }
        catch (ex) {
            ctx.throw('User not Found!', 404);
        }
    }
}