---
sip: 4
title: Merging of snap.manifest.json and package.json
status: Review
discussions-to: https://github.com/MetaMask/SIPs/discussions/51
author: Olaf Tomalka (@ritave)
created: 2022-09-23
---

## Abstract

A proposed specification of a new `package.json` file that includes all the data needed to execute the snap, removing `snap.manifest.json` altogether.

This SIP intends to supersede [Snaps Publishing Specification v0.1](https://github.com/MetaMask/specifications/blob/c226cbaca1deb83d3e85941d06fc7534ff972336/snaps/publishing.md).

## Motivation

There are multiple fields that are the same in `package.json` files and `snap.manifest.json` files that routinely become desynchronized.
Visual Studio Code adds it's own properties to the package.json successfully. Merging those two files will be beneficial for the developers while still allowing other snap sources outside of NPM.

Because this SIP intends to supersede the previous specification, all behavior has been re-specified to serve as a singular source of truth.

## Specification

> Such sections are non-normative

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### package.json

> The full JSON Schema for snap's package.json [can be found in the assets](../assets/sip-4/package.schema.json).

The snap's `package.json` MUST adhere to `package.json` schema as [defined by the NPM organization](https://docs.npmjs.com/cli/v8/configuring-npm/package-json). That schema is extended with the following behavior:

- `package.json`
  - `.description` - The wallet MAY use this field to display information about the snap to the user.
  - `.version` - MUST be a valid [SemVer](https://semver.org/spec/v2.0.0.html) string. DApps MAY request specific version ranges. If a mismatch occurs between requested version range and the version inside the fetched snap, that snap MUST NOT be installed.
    > Additionally, wallet MAY allow updating snaps to the requested version in some schemes.
    > For example, if the installed snap is `npm:my-snap@1.0.0` while the dapp requests `npm:my-snap@^2.0.0`, the wallet will try to get the newest version from [npm.js](https://npmjs.com) and will update the snap a version that satisfies `^2.0.0`.
  - `.main` - Filepath relative to `package.json` with location of the snaps bundled source code to be executed.
  - `.engines` - The wallet SHALL introduce `snaps` engine which will follow semver versioning. If the requested SemVer is not satisfied by the extension run by the end-user, the snap MUST NOT be executed.
    - The first version of `snaps` engine after implementing this SIP SHALL be `1.0.0`.
    - The MetaMask team SHALL adhere to the following social contract:
      - Any breaking changes to the API or changes to the `package.json` that require all snaps to update SHALL update the `major` part (`1.0.0` -> `2.0.0`).
      - Any new backwards-compatible new features SHALL update the `minor` part (`1.0.0` -> `1.1.0`).
      - Any bug fixes SHALL update the `patch` part (`1.0.0` -> `1.0.1`).
  - `.snap` - MUST exist and MUST be a JSON object with snap specific metadata.
    - `.snap.proposedName` - MUST exist. User readable name that the wallet MAY show in the UI. The name MUST be shorter or equal to 214 characters.
    - `.snap.permissions` - MUST exist. Permissions that the snap is requesting.
    - `.snap.checksum` - MUST exist and MUST be a JSON object specified below. The checksum in package.json MUST match the checksum of the code executed by the wallet.
      - `.snap.checksum.algorithm` - The algorithm field MUST be `sha-256`.
      - `.snap.checksum.hash` - The resulting checksum hash as described in [Checksum](#checksum) paragraph.
    - `.snap.icon` - MAY exist. The location of the icon that the wallet MAY use to identify the snap to the user in the UI. The icon MUST be in SVG file format.

### Checksum

The checksum SHALL be calculated using SHA-256 algorithm as specified in NIST's [FIPS PUB 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).

The checksum SHALL be calculated over the file located under `package.json:.main` path and saved under `package.json:.snap.checksum.hash` as Base64 field with 44 characters. The Base64 character set MUST be `A-Z`, `a-z`, `0-9`, `+`, `/` with `=` used for padding.

## Test vectors

## `package.json`

> You can find an example [`package.json` in the assets](../assets/sip-4/package.json).

## Checksum

> The shashum was generated using `shasum -a 256 assets/sip-4/source.js | cut -d ' ' -f 1 | xxd -r -p | base64` command

- [`assets/sip-4/source.js`](../assets/sip-4/source.js) - `x3coXGvZxPMsVCqPA1zr9SG/bw8SzrCPncClIClCfwA=`
- `<empty file>` - `47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=`

## Backwards compatibility

This SIP intends to break backwards compatibility. We propose that MetaMask Flask follows our standard practice of informing the community of deprecation for one version of Flask and remove the old way altogether in the following one.

List of breaking changes:

- Removal of `snap.manifest.json` and reliance on `package.json`

### Potential incompatibilities

While most of the properties of the files are interchangeable in the data they can represent, aside from the data structure, we've singled out `package.json:main` / `snap.manifest.json:source.location` as a potentially incompatible. `package.json` assumes that the bundle is included along with the `package.json` in one directory, while `snap.manifest.json` does not make that assumption. This means that `snap.manifest.json` can live in one location while source files in the second.

We haven't identified any cases where that separation would be useful. NPM, IPFS, http and local all have concepts of directories that can be leveraged, and thus this SIP proposes that we remove the distinction of different locations for the manifest and the source.

## Appendix I: Identifying required data

This is the minimal set of information we need to know about a snap to manage it properly and location of where it currently lives at the time of writing this SIP.

- _Duplicate_
  - `snap.manifest.json:description` / `package.json:description` - User readable description of the snap.
  - `snap.manifest.json:version` / `package.json:version` - Version of the snap.
  - `snap.manifest.json:repository` / `package.json:repository` - The location of the source code.
  - `snap.manifest.json:manifestVersion` / `package.json:engines` - The version of the metamask for which the snap was written for.
  - `snap.manifest.json:source.location` / `package.json:main` - The location of the bundle file.
- _`snap.manifest.json`_
  - `snap.manifest.json:proposedName` - The user readable name shown in the UI of the wallet.
  - `snap.manifest.json:initialPermissions` - Permissions that the snap is requesting from the user.
  - `snap.manifest.json:shasum` - The shashum of the bundled source required for security purposes.
  - `snap.manifest.json:source.location.npm.iconPath` - _(optional)_ The location of the icon file that represents the snap in the UI of the wallet.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
