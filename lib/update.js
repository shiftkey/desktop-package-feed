const path = require('path')
const { mkdirp } = require('fs-extra')
const { Octokit } = require('@octokit/rest')
const temp = require('temp')

const { sudo } = require('./commands')
const { getContentFilePath } = require('./content')
const { addDebianReleaseToFeed } = require('./packaging/apt')
const { addRedHatReleaseToFeed } = require('./packaging/rpm')
const { regenerateAptDirectory } = require('./packaging/apt-metadata')
const { regenerateRpmDirectory } = require('./packaging/rpm-metadata')
const { getChecksumFromRelease } = require('./release')

async function update(baseDir, keyName, token) {
  // TODO: any other content we want to deploy as part of the update step?
  const indexFilePath = getContentFilePath('index.html')

  // TODO: this shouldn't need admin rights to perform after the right init work
  await sudo(['cp', indexFilePath, baseDir])

  if (!token || token.length === 0) {
    console.warn(
      'No GitHub token found in parameters - API calls may be rate-limited'
    )
  }

  const cacheDir = path.join(temp.dir, 'desktop-package-cache')
  await mkdirp(cacheDir)

  console.log(`using cache directory: '${cacheDir}'`)

  const options = token ? { auth: token } : undefined
  const octokit = new Octokit(options)

  const { data } = await octokit.repos.listReleases({
    owner: 'shiftkey',
    repo: 'desktop',
  })

  const threeReleases = data.slice(0, 3)

  for (const release of threeReleases) {
    await updateRelease(release, baseDir, cacheDir, keyName)
  }

  await regenerateAptDirectory(baseDir, keyName)
  await regenerateRpmDirectory(baseDir)
}

async function updateRelease(release, baseDir, cacheDir, keyName) {
  const debianFile = release.assets.find((a) => path.extname(a.name) == '.deb')
  if (!debianFile) {
    console.log(`Unable to find debian installer in release, skipping...`)
    return
  }

  const debianUrl = debianFile.browser_download_url
  const debianFileName = path.basename(debianUrl)
  const debianChecksum = getChecksumFromRelease(debianFileName, release.body)

  await addDebianReleaseToFeed(
    debianUrl,
    cacheDir,
    baseDir,
    keyName,
    debianChecksum
  )

  const rpmFile = release.assets.find((a) => path.extname(a.name) == '.rpm')
  if (!rpmFile) {
    console.log(`Unable to find rpm installer in release, skipping...`)
    return
  }

  const redHatUrl = rpmFile.browser_download_url
  const redHatFileName = path.basename(redHatUrl)
  const redHatChecksum = getChecksumFromRelease(redHatFileName, release.body)

  await addRedHatReleaseToFeed(
    redHatUrl,
    cacheDir,
    baseDir,
    keyName,
    redHatChecksum
  )
}

module.exports = {
  update,
}
