const { join } = require('path')
const {
  getPackageType,
  getPackageDir,
  getFeedDetails,
} = require('../lib/packaging')

describe('packaging', () => {
  describe('getPackageType', () => {
    it('raises error empty string', () => {
      expect(() => getPackageType('')).toThrow()
    })

    it('raises error for no extension', () => {
      expect(() => getPackageType('fooo')).toThrow()
    })

    it('returns deb for debian file extension', () => {
      expect(getPackageType('some-file.deb')).toEqual('deb')
    })

    it('handles spaces in file names', () => {
      expect(getPackageType('some file.deb')).toEqual('deb')
    })

    it('returns rpm for rpm file extension', () => {
      expect(getPackageType('some-file.rpm')).toEqual('rpm')
    })
  })

  describe('getPackageDir', () => {
    const baseDir = '/some/path'

    it('rejects unknown type', () => {
      expect(() => getPackageDir(baseDir, 'foo')).toThrow()
    })

    it('returns expected directory for rpm', () => {
      expect(getPackageDir(baseDir, 'rpm')).toEqual('/some/path/rpm')
    })

    it('defaults to amd64 for deb', () => {
      expect(getPackageDir(baseDir, 'deb')).toEqual('/some/path/deb/amd64')
    })

    it('uses arch when specified for deb', () => {
      expect(getPackageDir(baseDir, 'deb', 'arm64')).toEqual(
        '/some/path/deb/arm64'
      )
    })

    it('rejects unrecognized arch when specified for deb', () => {
      expect(() => getPackageDir(baseDir, 'deb', 'foo')).toThrow()
    })
  })

  describe('getFeedDetails', () => {
    const baseDir = '/some/path'
    const debDirectory = join(baseDir, 'deb', 'amd64')
    const rpmDirectory = join(baseDir, 'rpm')

    const latestReleaseDownloads =
      'https://github.com/shiftkey/desktop/releases/download/release-2.8.1-linux2'

    it('rejects an non-GitHub URL', () => {
      expect(() => getFeedDetails(baseDir, 'http://example.com')).toThrow()
    })

    it('returns the expected details for a debian installer URL', () => {
      const fileName = 'GitHubDesktop-linux-2.8.1-linux2.deb'

      expect(
        getFeedDetails(baseDir, `${latestReleaseDownloads}/${fileName}`)
      ).toEqual({
        fileName,
        fullPath: join(debDirectory, fileName),
        packageDir: debDirectory,
      })
    })

    it('returns the expected details for a debian installer URL', () => {
      const fileName = 'GitHubDesktop-linux-2.8.1-linux2.rpm'

      expect(
        getFeedDetails(baseDir, `${latestReleaseDownloads}/${fileName}`)
      ).toEqual({
        fileName,
        fullPath: join(rpmDirectory, fileName),
        packageDir: rpmDirectory,
      })
    })

    it('rejects the AppImage URL', () => {
      const fileName = 'GitHubDesktop-linux-2.8.1-linux2.AppImage'

      expect(() =>
        getFeedDetails(baseDir, `${latestReleaseDownloads}/${fileName}`)
      ).toThrow()
    })
  })
})
