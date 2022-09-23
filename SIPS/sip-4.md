---
sip: 4
title: Merging of snap.manifest.json and package.json
status: Draft
discussions-to (*optional): (Http/Https URL)
author: Olaf Tomalka (@ritave)
created: 2022-09-23
---

## Abstract

A proposed specification of a new `package.json` file that includes all the data needed to execute the snap, removing `snap.manifest.json` altogether.

This SIP intends to supersede [Snaps Publishing Specification v0.1](https://github.com/MetaMask/specifications/blob/c226cbaca1deb83d3e85941d06fc7534ff972336/snaps/publishing.md).

## Motivation

There are multiple fields that are the same in `package.json` files and `snap.manifest.json` files that routinely become desynchronized.
Visual Studio Code adds it's own properties to the package.json successfully. I believe merging those two files will be beneficial for the developers while still allowing other snap sources outside of NPM.

Because this SIP intends to supersede the previous specification, all behavior has been re-specified to server as a singular source of truth.

## Specification

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap ID

The ID is an URI as defined in [RFC-3986](https://datatracker.ietf.org/doc/html/rfc3986) consisting of a `scheme`, `host` and a `path`.

### Supported schemes

- `npm` - (example `npm:my-snap`). The snap SHALL be looked for in the [npmjs.com](https://npmjs.com) registry with the `path` component acting as it's NPM id. The wallet MAY NOT need to support any other `host` outside of [registry.npmjs.com](https://npmjs.com). The wallet will search for `package.json` in the root directory of the package. All files referenced in `package.json` SHALL be searched for relative to the root directory of the package.
- `http` / `https` - (example `http://localhost:8080/foo/package.json`). The `package.json` MUST be under that URL. All files referenced in `package.json` SHALL be looked relative to the path of `package.json`.
  > For example, `package.json:main: "bar/index.js"` will be looked at in `http://localhost:8080/foo/bar.index.js`.
- `ipfs` - (example: `ipfs://bafybeifpaez32hlrz5tmr7scndxtjgw3auuloyuyxblynqmjw5saapewmu`). The `path` MUST be an IPFS directory. The wallet SHALL look for `package.json` in that directory. All files referenced in `package.json` SHALL be looked relative to the root directory.

### package.json

> The full JSON Schema for snap's package.json [can be found in the assets](../assets/sip-4/package.json.schema.json).

The snap's `package.json` MUST adhere to `package.json` schema as [defined by the NPM organization](https://docs.npmjs.com/cli/v8/configuring-npm/package-json). That schema is extended with the following behavior:

- `package.json`
  - `.description` - Used to display information about the snap to the user during installation.
  - `.version` - [SemVer](https://semver.org/spec/v2.0.0.html) version of the snap. DApps can request specific version ranges, if a mismatch occurs between requested version range and the fetched snap, that snap MUST not be installed.
    > Additionally, wallet MAY allow updating snaps to the requested version in some ID schemes.
    > For example, if the installed snap is `npm:my-snap@1.0.0` while the dapp requests `npm:my-snap@^2.0.0`, the wallet will try to get the newest version from [npm.js](https://npm.js) and will update the snap a version that satisfies `^2.0.0`.
  - `.repository` - Unused by the wallet, exists only for informative purposes.
  - `.main` - The location of the snaps bundled source code to be executed.
  - `.engines` - The wallet SHALL introduce `snaps` engine which will follow semver versioning. The engine check is strict, meaning if a the requested semver is not satisfied by the extension run by the end-user, the snap MUST NOT be executed.
    - The first version of `snaps` engine after implementing this SIP SHALL be `1.0.0`.
    - The MetaMask team SHALL adhere to the following social contract:
      - Any breaking changes to the API or changes to the `package.json` that require all snaps to update will update the `major` part (`1.0.0` -> `2.0.0`).
      - Any new features will update the `minor` part (`1.0.0` -> `1.1.0`).
      - Any bug fixes will update the `patch` part (`1.0.0` -> `1.0.1`).
  - `.snap` - Snap specific metadata.
    - `.snap.proposedName` - User readable name that the wallet MAY show in the UI. The name MUST be shorter or equal to 214 characters.
    - `.snap.permissions` - Permissions that the snap is requesting.
    - `.snap.checksum` - The checksum of the source code bundle defined in `.main`.
      - `.snap.checksum.algorithm` - The algorithm used to calculate the checksum. See [Appendix II](#appendix-ii-checksum-algorithms) for list of supported algorithms.
      - `.snap.checksum.hash` - The resulting hash calculated from the `.main` source code using `.snap.checksum.algorithm` algorithm.
    - `.snap.icon` - The optional location of the icon that the wallet MAY use to identify the snap to the user in the UI.

## Test vector

> You can find an example [`package.json` in the assets](../assets/sip-4/package.example.json).

## Backwards compatibility

This SIP intends to break backwards compatibility. We propose that MetaMask Flask follows our standard practice of informing the community of deprecation for one version of Flask and remove the old way altogether in the following one.

- Removal of `snap.manifest.json` and reliance on `package.json`
- Removal of `local` Snap ID uri `scheme`, replaced by `http` and `https`. Today the implementation of `local` already behaves the same way as `http` would.

### Potential incompatibilities

While most of the properties of the files are interchangeable in the data they can represent, aside from the data structure, we've singled out `package.json:main` / `snap.manifest.json:source.location` as a potentially incompatible. `package.json` assumes that the bundle is included along with the `package.json` in one directory, while `snap.manifest.json` does not make that assumption. This means that `snap.manifest.json` can live in one location while source files in the second.

We haven't identified any cases where that separation would be useful. NPM, IPFS and local all have concepts of directories that can be leveraged, and thus this SIP proposes that we remove the distinction of different locations for the manifest and the source.

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

### Appendix II: Checksum algorithms

There is only one supported checksum algorithm at this time that can be used in `package.json:snap.checksum.algorithm`.

- `sha-256`. The SHA-256 algorithm for checksum.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
