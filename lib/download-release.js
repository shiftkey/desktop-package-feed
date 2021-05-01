const hasha = require('hasha')
const { pathExists, rm } = require('fs-extra')

const { runCommand } = require('./commands')
const { getChecksumFromRelease } = require('./release')
const { getFeedDetails } = require('./packaging')

async function downloadReleaseFile(basedir, url, body) {
  const { packageDir, fileName, fullPath } = getFeedDetails(basedir, url)

  const existsOnDisk = await pathExists(fullPath)
  if (existsOnDisk) {
    await rm(fullPath, { force: true, maxRetries: 3 })
  }

  console.log(`Downloading release ${fileName}`)

  await runCommand(['curl', '-s', '-L', url, '-o', fileName], {
    cwd: packageDir,
  })

  const checksum = getChecksumFromRelease(fileName, body)

  const hashBefore = await hasha.fromFile(fullPath, { algorithm: 'sha256' })

  if (checksum !== hashBefore) {
    throw new Error(
      `Checksum ${checksum} for file ${fileName} does not match ${hashBefore} found in release notes`
    )
  }

  return outputPath
}

module.exports = {
  downloadReleaseFile,
  getFeedDetails,
}
