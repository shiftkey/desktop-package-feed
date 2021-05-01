const execa = require('execa')
const { copyFile, pathExists } = require('fs-extra')

const { checkCacheState, downloadToCache } = require('../cache')
const { getFeedDetails } = require('../packaging')

async function checkSignature(keyName, fullPath) {
  const { exitCode, stdout } = await execa('dpkg-sig', ['-c', fullPath])
  if (exitCode !== 0) {
    console.log(`unable to check signature of ${fullPath} - stdout '${stdout}'`)
    return 'error'
  }

  const goodSigFound = stdout.indexOf('GOODSIG') > -1
  return goodSigFound ? 'signed' : 'invalid'
}

async function signPackage(keyName, fullPath) {
  const { exitCode, stdout } = await execa('dpkg-sig', [
    '-s',
    'repo',
    '-k',
    keyName,
    fullPath,
  ])
  if (exitCode !== 0) {
    console.log(`unable to check signature of ${fullPath} - stdout '${stdout}'`)
    return 'error'
  }

  const goodSigFound = stdout.indexOf('GOODSIG') > -1
  return goodSigFound ? 'signed' : 'invalid'
}

async function checkPackageStatus(url, baseDir, keyName) {
  const { fullPath } = getFeedDetails(baseDir, url)

  const exists = await pathExists(fullPath)
  if (!exists) {
    return 'missing'
  }

  return checkSignature(keyName, fullPath)
}

async function addToRepository(cacheFilePath, baseDir, url, keyName) {
  const { fileName, fullPath } = getFeedDetails(baseDir, url)

  await copyFile(cacheFilePath, fullPath)
  await signPackage(keyName, fullPath)

  const result = await checkSignature(keyName, fullPath)

  if (result === 'signed') {
    console.log(`Package ${fileName} added to feed`)
  } else {
    throw new Error(
      `Package ${fileName} could not be added to feed - ${result}`
    )
  }
}

async function addDebianReleaseToFeed(
  url,
  cacheDir,
  baseDir,
  keyName,
  downloadChecksum
) {
  const state = await checkPackageStatus(url, baseDir, keyName)
  if (state === 'signed') {
    return
  }

  const { cacheFilePath, status } = await checkCacheState(
    cacheDir,
    url,
    downloadChecksum
  )

  if (status !== 'cached') {
    await downloadToCache(cacheDir, url, downloadChecksum)
  }

  await addToRepository(cacheFilePath, baseDir, url, keyName)
}

module.exports = {
  addDebianReleaseToFeed,
}
