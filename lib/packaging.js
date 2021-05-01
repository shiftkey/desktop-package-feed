const path = require('path')

/**
 * Resolve the package type from a provided file name
 *
 * @param {String} fileName - file name with extension
 *
 * @returns the valid file extension 'deb' or 'rpm', or raised an error for all
 *          other inputs
 */
function getPackageType(fileName) {
  const extension = path.extname(fileName)

  if (extension.length <= 1) {
    throw new Error(
      `Extension '${extension}' does not match expected format, giving up`
    )
  }

  const type = extension.substring(1).toLowerCase()

  switch (type) {
    case 'deb':
    case 'rpm':
      return type
    default:
      throw new Error(`Extension ${type} not supported`)
  }
}

/**
 * Resolve the package directory based on the type of package
 *
 * @param {String} basedir - the root directory of the package site
 * @param {String} type - the file extension associated with the package - 'deb' and 'rpm' supported
 * @param {String?} arch - optional architecture (defaults to amd64)
 *
 * @returns The directory on disk in the package site to store this package
 */
function getPackageDir(basedir, type, arch) {
  if (type === 'deb') {
    if (arch && arch !== 'amd64' && arch !== 'arm64') {
      throw new Error(`Architecture ${arch} not supported for Debian feed`)
    }

    arch = arch ?? 'amd64'
    return path.join(basedir, type, arch)
  }

  if (type === 'rpm') {
    return path.join(basedir, type)
  }

  throw new Error(`Unsupported type ${type}`)
}

function getFeedDetails(basedir, url) {
  const fileName = path.basename(url)
  const type = getPackageType(fileName)
  const packageOutputDir = getPackageDir(basedir, type)
  const fullPath = path.join(packageOutputDir, fileName)
  return {
    packageDir: packageOutputDir,
    fileName,
    fullPath,
  }
}

module.exports = {
  getFeedDetails,
  getPackageDir,
  getPackageType,
}
