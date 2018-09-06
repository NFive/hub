const cronjob = require('cron').CronJob;
const rest = require('@octokit/rest');
const github = new rest()
const Plugins = require('../models/plugins')
const util = require('util');

(async () => {
    try
    {
        var result = await github.search.repos({ q: 'topic:nfive-plugin' })
        
        for (let i of result.data.items) {
            try
            {
                await Plugins.findOneAndUpdate({gh_id: i.id}, new Plugins({ 
                    gh_id: i.id,
                    user: i.owner.login,
                    repo: i.name,
                    full_name: i.full_name,
                    user_url: i.owner.html_url,
                    avatar_url: i.owner.avatar_url,
                    repo_url: i.html_url,
                    description: i.discription,
                    plugincreated: i.created_at,
                    pluginupdated: i.updated_at,
                    license_key: i.license.id,
                    license_name: i.license.name,
                    license_short: i.license.spdx_id,
                    license_url: i.license.html_url
                }), {upsert: true, new: true})
            }
            catch (err){ util.log('Error: %s', err) }

            util.log('id: %s | %s has been saved', i.id, i.name)
        }
    }
    catch (err){ util.log('Error: %s', err) }
})()
    

var job = new cronjob({
    cronTime: '0 * * * *',
    onTick: function() {
        
    },
    start: true,
    timeZone: 'Europe/London'
})