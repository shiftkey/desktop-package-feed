const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const { init } = require('./lib/init')
const { update } = require('./lib/update')

const DefaultHost = 'packages.shiftkey.dev'
const DefaultEmail = `github@brendanforster.com`

yargs(hideBin(process.argv))
  .command(
    'init',
    'initialize the server',
    (yargs) => {
      yargs
        .option('host', {
          describe: 'hostname for site',
          type: 'string',
          default: DefaultHost,
        })
        .option('email', {
          describe: "email address to register for Let's Encrypt",
          type: 'string',
          default: DefaultEmail,
        })
        .option('azure', {
          describe: 'run Azure-specific steps in workflow',
          type: 'boolean',
          default: false,
        })
    },
    ({ host, email, azure }) => {
      const basedir = `/var/www/${host}`
      init(basedir, host, email, azure)
    }
  )
  .command(
    'update',
    'check for new releases and update feeds',
    (yargs) => {
      yargs
        .option('host', {
          describe: 'hostname for site',
          type: 'string',
          default: DefaultHost,
        })
        .option('token', {
          describe: 'GitHub token to use for API calls',
          type: 'string',
        })
        .option('keyName', {
          describe: 'GPG key to use for signing package information',
          type: 'string',
          demandOption: true,
        })
    },
    ({ host, keyName, token }) => {
      const basedir = `/var/www/${host}`
      update(basedir, keyName, token)
    }
  ).argv
