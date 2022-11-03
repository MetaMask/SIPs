---
sip: 8
title: Snap Locations
status: Draft
discussions-to (*optional): (Http/Https URL)
author: Olaf Tomalka (@ritave)
created: 2022-11-03
---

## Abstract

A specification of URIs the DApp can use under which the wallet looks for snaps.
It describes location URIs which can be used to locate snap as well as specifying how to access relative files.

## Motivation

Currently Snap IDs are used both as the unique identifier as well as location to look for a snap. This introduces weird behavior where a snap installed from different places (such as npm and http) with the same code is different while different snaps from one location (such as multiple deployments from http://localhost:8080) are treated as single continuously updated snap and share persistent state.

This SIP is part of separating Snap IDs into location and a unique identifier.

## Specification

> Such sections are considered non-normative.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Location

The location of a snap MUST be an URI as defined in [RFC-3986](https://datatracker.ietf.org/doc/html/rfc3986).

> URI consists of a `scheme`, `authority` and a `path`, which we use throughout this SIP.

### Supported schemes

- `npm` - The snap SHALL be searched for using [registry.npmjs.com](https://registry.npmjs.com) protocol. `https` SHALL be used as the underlying transport protocol.
  - The `authority` part of the URI SHALL indicate the npmjs-like registry to use. The `authority` MAY be omitted and the default [https://registry.npmjs.com](https://registry.npmjs.com) SHALL be used instead.
  - The `path` represents the package's id namespaced to the registry. The wallet SHALL search for `package.json` in the root directory of the package. All files referenced in `package.json` SHALL be searched for relative to the root directory of the package.
- `http` / `https` - The `package.json` MUST be under that URL. All files referenced in `package.json` SHALL be searched for relative to the path of `package.json` using relative URL resolution as described by [RFC 1808](https://www.ietf.org/rfc/rfc1808.txt).
- `ipfs` - The `authority` MUST be an IPFS CID that is also a directory. The wallet SHALL search for `package.json` in root of that directory. All files referenced in `package.json` SHALL be looked relative to the root directory.

## Test vectors

### NPM

- `npm:my-snap`
  - `scheme` - `npm`
  - `authority` - `https://registry.npmjs.com`
  - `path` - `my-snap`
- `npm://root@my-registry.com:8080/my-snap`
  - `scheme` - `npm`
  - `authority` - `https://root@my-registry.com:8080`
  - `path` - `my-snap`

### HTTP / HTTPS

> Test vectors for HTTP are considered the same except the differing scheme

- `https://localhost:8080`
  - `scheme` - `https`
  - `authority` - `localhost:8080`
  - `path` - _(zero-length)_
  - `package.json:main: "dist/index.js"` - `https://localhost:8080/dist/index.js`
- `https://my-host.com/my-snap`
  - `scheme` - `https`
  - `authority` - `my-host.com`
  - `path` - `my-snap`
  - `package.json:main: "dist/index.js"` - `https://my-host.com/dist/index.js`
- `https://my-host.com/my-snap/`
  - `scheme` - `https`
  - `authority` - `my-host.com`
  - `path` - `my-snap/`
  - `package.json:main: "dist/index.js"` - `https://my-host.com/my-snap/dist/index.js`

### IPFS

- `ipfs://bafybeifpaez32hlrz5tmr7scndxtjgw3auuloyuyxblynqmjw5saapewmu`
  - `scheme` - `ipfs`
  - `authority` - `bafybeifpaez32hlrz5tmr7scndxtjgw3auuloyuyxblynqmjw5saapewmu`
  - `path` - _(zero-length)_
  - `package.json:main: "dist/index.js"` - `ipfs://bafybeifpaez32hlrz5tmr7scndxtjgw3auuloyuyxblynqmjw5saapewmu/dist/index.js`

## Backwards compatibility

Any SIPs that break backwards compatibility MUST include a section describing those incompatibilities and their severity. The SIP SHOULD describe how the author plans on proposes to deal with such these incompatibilities.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
