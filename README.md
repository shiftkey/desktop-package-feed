# Desktop Package Feed

**Warning:** This project is for a very specific purpose of mine, and while it
is an open source project I have no specific plans beyond solving a problem I
have.

## About

This project is a set of scripts I've used to initialize and update a minimal
package feed for various Linux distributions. After reading some helpful
resources about self-hosting, I started building tooling to suppport:

- configuring a virtual machine from scratch
- create the necessary Apache config
- enable Let's Encrypt so all traffic is done over HTTPS
- retrieve installers from known locations
- checksum the installers and sign them with a PGP key I provide
- setup the package feeds (DEB and RPM supported currently)

## Requirements

- Some flavour of Ubuntu (mostly tested on 16.04 and 18.04 currently)
- `sudo` access - to install packages and act as root
- `git` - to clone the repository to the virtual machine
- Node 15+ - what the tooling is written in

## Setup

Before running, ensure your machine is correctly

- you have a DNS A record for your server pointing to the virtual machine's
  public IP address
- the virtual machine is accesible over port 80 and 443 - this enables the Let's
  Encrypt setup to complete successfully

With your vanilla machine ready, the first step is to bootstrap the
environment:

```
# don't forget to setup the project!
$ npm i
$ npm run init
```

This will handle obtaining and installing packages, as well as configuring the
environment.

There are additional parameters which you can see under the `--help` option,
but these default to what I require (to save on repetition):

```
$ npm run init -- --help

> desktop-package-feed@1.0.0 init
> node index.js init "--help"

index.js init

initialize the server

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --host     hostname for site       [string] [default: "packages.shiftkey.dev"]
  --email    email address to register for Let's Encrypt
                                 [string] [default: "github@brendanforster.com"]
  --azure    run Azure-specific steps in workflow     [boolean] [default: false]
```

This will take a few minutes to run, but once completed you should be able to
access a "Coming Soon" landing page on your host, which is an indicator the
environment is ready to go.

## Update

Once you've setup the environment, the nest step is to retrieve and sign the
packages and create the necessary metadata on disk.

```
$ npm run update -- --keyName [key]
```

The full set of options are outlined under `--help`:

```
npm run update -- --help

> desktop-package-feed@1.0.0 update
> node index.js update "--help"

index.js update

check for new releases and update feeds

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --host     hostname for site       [string] [default: "packages.shiftkey.dev"]
  --token    GitHub token to use for API calls                          [string]
  --keyName  GPG key to use for signing package information  [string] [required]
```

Because we need to sign the packages as well as the package metadata, the
relevant GPG private and public keys need to be present on the virtual machine.
You can find the secret keys on the machine using this command:

```
$ gpg --list-secret-keys
```

If the email address you used is distinct from the others, that can be used
for `--keyName` - otherwise you'll need to use the identifier.

If your GPG keys are protected with a passphrase, ensure the passphrase is
cached in memory before running this command, or be around to enter your key
when the tool prompts you for it.

The tool is hard-coded to retrieve the 3 latest releases from `shiftkey/desktop`
and it makes assumptions about how to find the checksums for the release
artifacts. It also assumes SHA256 checksums for the artifacts, when it does the
verification.

Once the files are downloaded and validated, they are moved into the package
repository on disk and signed using the GPG private key specified. After the
files are in place and signed the package metadata is generated and signed
where required using GPG.

## Questions

### Why not use [some other product]?

As the maintainer of the GitHub Desktop for Linux fork, I have significant
interest to make these packages available to consume in package managers for
multiple distributions, and the existing options all seem to have hurdles that
means I cannot support them:

- require source packages
- require control of the build or packaging process
- lack support for GPG signing
- lack support for both DEB and RPM packages
- have price/bandwidth quotas that I hit each month without fail, leading to
  throttling
- have obligations to promote the product in exchange for support

I've researched so many options, and evaluated several, but nothing seems to
come close to what I require and can support. So I'm trying a custom solution
now to support what I need.

### Can I use this project for some other situation?

I haven't really thought about supporting more than what I need right now, to
confirm this is something I want to support.

The codebase itself is fairly modular, so one _could_ hack it into supporting
other things, but I don't advise doing this in an environment you care about.
I've been testing this in throwaway virtual machines to get it robust, and I
recommend the same approach if you want to play around

### How can I help?

Stay tuned for issues once I've verified this in with some real-world setups
and environments, and documented how to get involved with testing the live site.
