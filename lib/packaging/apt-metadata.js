const path = require('path')
const { rm } = require('fs-extra')

const { pipeToFile, runCommand } = require('../commands')

async function regenerateAptDirectory(basedir, keyName) {
  // https://medium.com/sqooba/create-your-own-custom-and-authenticated-apt-repository-1e4a4cf0b864
  // https://askubuntu.com/a/89698
  const packageOutputDir = path.join(basedir, 'deb')

  const options = { cwd: packageOutputDir }

  const packagesFilePath = path.join(packageOutputDir, 'Packages')

  await pipeToFile(
    ['apt-ftparchive', 'packages', '.'],
    options,
    packagesFilePath
  )

  await runCommand(['bzip2', '-kf', 'Packages'], options)

  const releasesFilePath = path.join(packageOutputDir, 'Release')
  await pipeToFile(
    ['apt-ftparchive', 'release', '.'],
    options,
    releasesFilePath
  )

  await rm(path.join(packageOutputDir, 'Release.gpg'), {
    maxRetries: 3,
    force: true,
  })
  await runCommand(
    ['gpg', '-abs', '-o', 'Release.gpg', '--default-key', keyName, 'Release'],
    options
  )

  await rm(path.join(packageOutputDir, 'InRelease'), {
    maxRetries: 3,
    force: true,
  })
  await runCommand(
    [
      'gpg',
      '--clearsign',
      '-o',
      'InRelease',
      '--default-key',
      keyName,
      'Release',
    ],
    options
  )

  const publicKeyPath = path.join(packageOutputDir, 'KEY.gpg')
  await runCommand(
    [
      'gpg',
      '-o',
      publicKeyPath,
      '--armor',
      '--export',
      '--default-key',
      keyName,
    ],
    options
  )
}

module.exports = {
  regenerateAptDirectory,
}
