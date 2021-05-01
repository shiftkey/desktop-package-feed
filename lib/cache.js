const path = require('path')
const { rm, pathExists } = require('fs-extra')
const hasha = require('hasha')

const { runCommand } = require('./commands')

function getCacheLocation(cacheDir, fileName) {
  return path.join(cacheDir, fileName)
}

async function checkCacheState(cacheDir, url, checksum) {
  const fileName = path.basename(url)
  const cacheFilePath = getCacheLocation(cacheDir, fileName)

  const exists = await pathExists(cacheFilePath)
  if (!exists) {
    console.log(`checkCacheState: ${cacheFilePath} does not exist in cache`)
    return { cacheFilePath, status: 'missing' }
  }

  const cacheHash = await hasha.fromFile(cacheFilePath, { algorithm: 'sha256' })
  if (checksum === cacheHash) {
    return { cacheFilePath, status: 'cached' }
  }

  console.log(
    `checkCacheState: ${cacheFilePath} is in cache, expected ${checksum} but got ${cacheHash}`
  )

  return { cacheFilePath, status: 'invalid' }
}

async function downloadToCache(cacheDir, url, checksum) {
  const fileName = path.basename(url)
  const fullPath = path.join(cacheDir, fileName)

  const existsOnDisk = await pathExists(fullPath)
  if (existsOnDisk) {
    await rm(fullPath, { force: true, maxRetries: 3 })
  }

  console.log(`Downloading release ${fileName} to ${cacheDir} `)

  await runCommand(['curl', '-s', '-L', url, '-o', fileName], {
    cwd: cacheDir,
  })

  const hashBefore = await hasha.fromFile(fullPath, { algorithm: 'sha256' })

  if (checksum !== hashBefore) {
    throw new Error(
      `Checksum ${checksum} for file ${fileName} does not match ${hashBefore} found in release notes`
    )
  }
}

module.exports = {
  checkCacheState,
  downloadToCache,
  getCacheLocation,
}
