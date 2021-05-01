const { fastResolver } = require('dns-fast-resolver')
const execa = require('execa')

/** Resolve the IPv4 address of a given hostname */
function resolveDNS(address) {
  return new Promise((resolve, reject) => {
    fastResolver(address, { family: 4 }, (error, address) => {
      if (error) {
        reject(err)
        return
      }

      resolve(address)
    })
  })
}

/** Resolve the public IPv4 address of the currrent machine, using a helper site */
async function resolveCurrentIP() {
  const result = await execa('curl', ['https://ipinfo.io/ip'])
  return result.stdout
}

/**
 * Check that the public IP address of the current machine matches what can be
 * resolved using the DNS record of the desired host
 */
async function confirmIPMatchesDNS(host) {
  try {
    const dnsResult = await resolveDNS(host)
    console.log(`DNS resolved to ${dnsResult}`)

    const ipAddress = await resolveCurrentIP()
    console.log(`current IP resolved to ${ipAddress}`)

    const match = dnsResult === ipAddress

    if (!match) {
      console.log(
        `warning: need public IP address '${ipAddress}' to match address in DNS record '${dnsResult}' - update your DNS settings for ${host} before running script again`
      )
    }

    return match
  } catch (err) {
    console.log(`unable to check DNS matches public IP address`, err)
    return false
  }
}

module.exports = {
  confirmIPMatchesDNS,
}
