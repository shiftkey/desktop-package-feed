const { writeFile, readFile } = require('fs-extra')
const temp = require('temp')

const { sudo } = require('./commands')

async function checkConfig(host) {
  // TODO: certbot may create nested configs e.g. `-le-ssl-le-ssl.conf` and we
  //       should know how to resolve the right config

  const certBotSiteConfigPath =
    '/etc/apache2/sites-available/000-default-le-ssl.conf'

  const certbotConfigFile = await readFile(certBotSiteConfigPath, {
    encoding: 'utf8',
  })

  const expectedConfigPath = `DocumentRoot /var/www/${host}`

  const validDocumentRootFound =
    certbotConfigFile.indexOf(expectedConfigPath) > -1

  if (!validDocumentRootFound) {
    const regex = /DocumentRoot (.*)\n/

    const match = regex.exec(certbotConfigFile)

    if (match) {
      const group = match[1]

      const beforeText = `DocumentRoot ${group}`
      const updatedConfig = certbotConfigFile.replace(
        beforeText,
        expectedConfigPath
      )

      const tempPath = temp.path('.conf')
      await writeFile(tempPath, updatedConfig)

      await sudo(['cp', tempPath, certBotSiteConfigPath])

      temp.cleanupSync()

      console.log(`DocumentRoot updated to point to required directory`)
    }
  } else {
    console.log(`DocumentRoot element up-to-date`)
  }
}

module.exports = {
  checkConfig,
}
