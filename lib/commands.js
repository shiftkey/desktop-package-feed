const fs = require('fs')
const execa = require('execa')

function sudo(args, options) {
  options = options || { stdio: 'inherit' }
  return execa('sudo', args, options)
}

/**
 *
 * @param {Array} args
 * @param {execa.Options<string>} options
 * @returns
 */
async function runCommand(args, options) {
  options = Object.assign({ stdio: 'inherit' }, options)
  const arguments = [...args]
  const file = arguments.shift()

  const { stdout, stderr, exitCode } = await execa(file, arguments, options)

  if (exitCode !== 0) {
    console.log(`${file} exited with non-zero status code`)
    console.log(`---`)
    console.log(stdout)
    console.log(`---`)
    console.log(stderr)
    console.log(`---`)
    return
  }
}

async function pipeToFile(args, options, fileName) {
  const arguments = [...args]
  const file = arguments.shift()

  const subprocess = execa(file, arguments, options)

  subprocess.stdout.pipe(fs.createWriteStream(fileName))

  const { stdout, stderr, exitCode } = await subprocess

  if (exitCode !== 0) {
    console.log(`${file} exited with non-zero status code`)
    console.log(`---`)
    console.log(stdout)
    console.log(`---`)
    console.log(stderr)
    console.log(`---`)
    return
  }
}

module.exports = {
  sudo,
  runCommand,
  pipeToFile,
}
