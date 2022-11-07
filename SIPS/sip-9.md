---
sip: 9
title: snap.manifest.json v0.1
status: Review
author: Erik Marks (@rekmarks), Olaf Tomalka (@ritave)
created: 2022-11-07
---

## Abstract

Specification of `snap.manifest.json` file in version 0.1.

## Motivation

The goal of this SIP is to supersede [Snaps Publishing Specification v0.1](https://github.com/MetaMask/specifications/blob/c226cbaca1deb83d3e85941d06fc7534ff972336/snaps/publishing.md), and move Snaps specifications into one place - Snaps Improvement Proposals.
It additionally provides a JSON Schema for the manifest.

## Specification

> Such sections are considered non-normative.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

## Folder Structure

> The published files of an example Snap published to npm under the package name `@metamask/example-snap` may look like this:
>
> ```
> example-snap/
> ├─ dist/
> │  ├─ bundle.js
> ├─ package.json
> ├─ snap.manifest.json
> ```

> A full example snap directory can be found in the [assets](../assets/sip-9/example-snap/).

The snap MUST contain both [`package.json`](#packagejson) and [`snap.manifest.json`](#snapmanifestjson) files in the root directory of the snap package.

### `package.json`

The `package.json` file MUST adhere to [the requirements of npm](https://docs.npmjs.com/cli/v7/configuring-npm/package-json).

### `snap.manifest.json`

> A complete JSON Schema can be [found in the assets](../assets/sip-9/snap.manifest.schema.json).

> Note that the manifest intentionally does not contain any information explicitly identifying its author.
> Author information should be verifiable out-of-band at the point of Snap installation, and is beyond the scope of this specification.

- `snap.manifest.json`

  - `.version` - MUST be a valid [SemVer][] version string and equal to the [corresponding `package.json` field](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#version).
  - `.proposedName` - MUST be a string less than or equal to 214 characters. <!-- This is what npm uses for the `name` field. -->
    The proposed name SHOULD be human-readable.

    > The snap's author proposed name for the snap.
    >
    > The Snap host application may display this name unmodified in its user interface.

  - `.description` - MUST be a non-empty string less than or equal to 280 characters. <!-- As of 2021, a Twitter post. -->
    MAY differ from the [corresponding `package.json` field](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#description-1)
    > A short description of the Snap.
    >
    > The Snap host application may display this name unmodified in its user interface.
  - `.repository` - MAY be omitted. If present, MUST be equal to the [corresponding `package.json` field](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#repository).
  - `.source`
    - `.shasum` - MUST hash of the snap source file as specified in [Checksum](#checksum) paragraph.
    - `.location` - MUST be an object containing the [`npm` field](#npm) as specified in the [Location-Specific Manifest Fields](#hosting-platform-manifest-fields) section.
      - `.npm`
        - `.filePath` - MUST be the [Unix-style][unix filesystem] path relative to the package root directory pointing to the Snap source file.
        - `.packageName` - MUST be equal to the [`name` filed of `package.json`](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#name).
        - `.iconPath` - MAY be omitted. If present, MUST be [Unix-style][unix filesystem] path relative to the package root directory pointing to an `.svg` file.
        - `.registry` - MAY be omitted. If present, MUST be string `https://registry.npmjs.org`.
  - `.initialPermissions` - MUST be a valid [EIP-2255][] `wallet_requestPermissions` parameter object.
    > Specifies the initial permissions that will be requested when the Snap is added to the host application.
  - `.manifestVersion` - MUST be the string `0.1`.

### Checksum

The checksum SHALL be calculated using SHA-256 algorithm as specified in NIST's [FIPS PUB 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).

The checksum SHALL be calculated over the file located under `snap.manifest.json:.source.location.npm.filePath` path and saved under `snap.manifest.json:.source.shasum` as Base64 field with exactly 44 characters. The Base64 character set MUST be `A-Z`, `a-z`, `0-9`, `+`, `/` with `=` used for padding. The padding SHALL NOT be optional.

### Snap Source File

> Represented in the example as `dist/bundle.js`. The Snap "source" or "bundle" file can be named anything and kept anywhere in the package file hierarchy

The snap source file, located under `snap.manifest.json:.source.location.npm.filePath` path MUST:

- have the `.js` file extension.
- contain the entire source of the Snap program, including all dependencies.
- execute under [SES][].

## Test vectors

### Checksum

> The shashum was generated using `shasum -a 256 assets/sip-9/source.js | cut -d ' ' -f 1 | xxd -r -p | base64` command

- [`assets/sip-9/source.js`](../assets/sip-9/source.js) - `x3coXGvZxPMsVCqPA1zr9SG/bw8SzrCPncClIClCfwA=`
- `<empty file>` - `47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=`

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).

[base64]: https://developer.mozilla.org/en-US/docs/Glossary/Base64
[eip-2255]: https://eips.ethereum.org/EIPS/eip-2255
[sha-256]: https://en.wikipedia.org/wiki/SHA-2
[semver]: https://semver.org/
[ses]: https://agoric.com/documentation/guides/js-programming/ses/ses-guide.html
[unix filesystem]: https://en.wikipedia.org/wiki/Unix_filesystem
