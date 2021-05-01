const { readFile } = require('fs-extra')
const { join, dirname } = require('path')

async function getContent(filename) {
  const fullFilePath = getContentFilePath(filename)
  const baseFile = await readFile(fullFilePath, {
    encoding: 'utf-8',
  })

  return baseFile
}

function getContentFilePath(filename) {
  const root = dirname(__dirname)
  return join(root, 'content', filename)
}

module.exports = {
  getContent,
  getContentFilePath,
}
