const execa = require('execa')
const { copyFile, pathExists } = require('fs-extra')

const { checkCacheState, downloadToCache } = require('../cache')
const { getFeedDetails } = require('../packaging')

// https://unix.stackexchange.com/questions/328601/rpmsign-with-cli-password-prompt

async function checkSignature(keyName, fullPath) {
  const { exitCode, stdout } = await execa('rpm', ['--checksig', fullPath])
  if (exitCode !== 0) {
    console.log(`unable to check signature of ${fullPath} - stdout '${stdout}'`)
    return 'error'
  }

  const validKey = false
  return validKey ? 'signed' : 'invalid'
}

async function signPackage(keyName, fullPath) {
  console.log(`TODO: sign package ${fullPath}`)
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
}

async function addRedHatReleaseToFeed(
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
  addRedHatReleaseToFeed,
}
