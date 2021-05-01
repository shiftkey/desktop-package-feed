const path = require('path')

const { runCommand } = require('../commands')

async function regenerateRpmDirectory(basedir) {
  // https://www.thegeekdiary.com/centos-rhel-how-to-create-and-host-yum-repository-over-httpd/
  const packageOutputDir = path.join(basedir, 'rpm')
  await runCommand(['createrepo', packageOutputDir], {})

  await runCommand(['chmod', '-R', 'o-w+r', packageOutputDir])

  // https://blog.packagecloud.io/eng/2014/11/24/howto-gpg-sign-verify-rpm-packages-yum-repositories/
  //  gpg --detach-sign --armor repodata/repomd.xml
}

module.exports = {
  regenerateRpmDirectory,
}
