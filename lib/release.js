/**
 * Extract the SHA256 checksum for a given file from the release notes text
 *
 * Will throw if no match can be found
 *
 * @param {String} fileName filename of installer
 * @param {String} body markdown text of release notes from GitHub
 *
 * @returns a string representing the SHA256 checksum for the file found in the release notes
 */
function getChecksumFromRelease(fileName, body) {
  const regex = new RegExp(`${fileName} - \`([a-f0-9]{64})\``)
  const matches = regex.exec(body)

  if (matches.length === 0) {
    throw new Error(`Could not find checksum for ${fileName} in release notes`)
  }

  return matches[1]
}

module.exports = {
  getChecksumFromRelease,
}
