const { join } = require('path')
const { writeFile } = require('fs-extra')
const temp = require('temp')

const { checkConfig } = require('./certbot')
const { sudo } = require('./commands')
const { getContent, getContentFilePath } = require('./content')
const { confirmIPMatchesDNS } = require('./network')

async function init(basedir, host, email, azure) {
  await sudo(['add-apt-repository', 'ppa:certbot/certbot', '--yes'])
  await sudo([
    'apt',
    'install',
    '-y',
    'certbot',
    'python-certbot-apache',
    'apache2',
    'dpkg-dev',
    'dpkg-sig',
    'createrepo',
  ])

  await sudo(['mkdir', '-p', join(basedir, 'deb', 'amd64')])
  await sudo(['mkdir', '-p', join(basedir, 'rpm')])

  if (azure) {
    await sudo(['chown', '-R', 'azureuser:azureuser', basedir])
  }

  const siteTemplateBase = await getContent('site-config.conf')
  const siteTemplateAfter = siteTemplateBase
    .replace('%%HOST_NAME%%', host)
    .replace('%%DOCUMENT_ROOT%%', basedir)

  const tempPath = temp.path('.conf')
  await writeFile(tempPath, siteTemplateAfter)

  const destinationFilePath = `/etc/apache2/sites-available/${host}.conf`
  await sudo(['cp', tempPath, destinationFilePath])

  temp.cleanupSync()

  const indexFile = await getContentFilePath('index.html')
  await sudo(['cp', indexFile, basedir])

  const match = await confirmIPMatchesDNS(host)

  if (!match) {
    return
  }

  //https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu-18-04
  await sudo([
    'certbot',
    '--apache',
    '-d',
    host,
    '--non-interactive',
    '--agree-tos',
    '-m',
    email,
  ])

  const { stdout } = await sudo(['systemctl', 'status', 'certbot.timer'], {})

  if (stdout.indexOf('active (waiting)') >= 0) {
    console.log(`certbot.timer service active`)
  }

  const { exitCode } = await sudo(['certbot', 'renew', '--dry-run'])
  if (exitCode === 0) {
    console.log(`dry run of certbot update completed without issue`)
  }

  await checkConfig(host)

  await sudo(['systemctl', 'restart', 'apache2.service'])
}

module.exports = {
  init,
}
