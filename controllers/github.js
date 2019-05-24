const config = require('config')
const util = require('util')
const unparsed = require('koa-body/unparsed.js')
const yaml = require('js-yaml')
const marked = require('marked')

const Plugins = require('../models/plugins');
const Octokit = require('@octokit/rest')
const octokit = new Octokit({
    auth: `token ${config.github.token}`
})
const Webhooks = require('@octokit/webhooks')
const webhooks = new Webhooks({
    secret: config.github.secret
})

exports.webhooks = async (ctx) => {
    try {
        await webhooks.verifyAndReceive({
            id: ctx.request.headers['x-github-delivery'],
            name: ctx.request.headers['x-github-event'],
            signature: ctx.request.header['x-hub-signature'],
            payload: ctx.request.body[unparsed]
        })
    } catch (ex) {
        util.log(ex)
    }
}

createPlugin = async (input) => {
    try {
        var repo = {
            id: input.id,
            owner: input.full_name.split("/")[0],
            project: input.full_name.split("/")[1]
        }
        var releases = []
        const latestRelease = await octokit.repos.getLatestRelease({
            owner: repo.owner,
            repo: repo.project
        })

        if (latestRelease) {
            var nfiveyml = await octokit.repos.getContents({
                owner: repo.owner,
                repo: repo.project,
                path: 'nfive.yml',
                ref: latestRelease.data.tag_name
            })
            var readme = await octokit.repos.getReadme({
                owner: repo.owner,
                repo: repo.project,
                ref: latestRelease.data.tag_name
            })

            if (nfiveyml) {
                nfiveyml = await Buffer.from(nfiveyml.data.content, 'base64').toString('utf8')
                nfiveyml = await yaml.safeLoad(nfiveyml, 'utf8', { json: true })

                if (readme) {
                    readme = await Buffer.from(readme.data.content, 'base64').toString('binary')
                    readme = await marked(readme)

                    if (latestRelease.data.tag_name == nfiveyml.version) {
                        release = {
                            version: nfiveyml.version,
                            download_url: latestRelease.data.assets[0].browser_download_url,
                            notes: latestRelease.data.body,
                            readme: readme,
                            //dependencies: dependencies, //Todo
                        }
                        await releases.push(release)

                        await Plugins.create({
                            gh_id: repo.id,
                            owner: nfiveyml.name.split("/")[0],
                            project: nfiveyml.name.split("/")[1],
                            description: nfiveyml.description,
                            releases: releases,
                            license: nfiveyml.license,
                        })
                        console.log(`${input.id} | ${input.full_name} created`)
                    } else {
                        console.log(`${input.id} | ${input.full_name} version doesn't match, no update occured`)
                    }
                } else {
                    console.log(`${input.id} | ${input.full_name} missing README.md, no update occured`)
                }
            } else {
                console.log(`${input.id} | ${input.full_name} error with nfive.yml, no update occured`)
            }
        } else {
            console.log(`${input.id} | ${input.full_name} has no release, no update occured`)
        }
    } catch (ex) {
        console.log(ex)
    }
}

updatePlugin = async (input) => {

}

startUp = async () => {
    try {
        await webhooks.on('installation', async (event) => {
            const payload = await JSON.parse(event.payload)
            console.log(`"${event.name}" event received for "${payload.repositories[0].full_name}" | ${payload.repositories[0].id}`)

            await createPlugin(payload.repositories[0])
        })
        await webhooks.on('release', async (event) => {
            const payload = await JSON.parse(event.payload)
            console.log(`"${event.name}" event received for "${payload.repositories[0].full_name}" | ${payload.repositories[0].id}`)

            //await updatePlugin(payload.repositories[0])
        })
        await webhooks.on('error', async (error) => {
            console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`)
        })
    } catch (ex) {
        util.log(ex)
    }
}

(async () => {
    try {
        await startUp()
    } catch (ex) {
        util.log(ex)
    }

})()

// const config = require('config')
// const util = require('util')

// const Octokit = require('@octokit/rest')
// const App = require('@octokit/app')

// try {
//     const app = new App({ id: config.github.appId, privateKey: config.github.key })
//     const jwt = await app.getSignedJsonWebToken()
//     const octokit = new Octokit({
//         auth: `bearer ${jwt}`
//     })

//     const installs = await octokit.apps.listInstallations({})
//     for (let i of installs.data) {
//         console.log(i)
//     }

// } catch (ex) {
//     util.log(ex)
// }