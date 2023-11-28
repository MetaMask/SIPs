---
sip: (To be assigned)
title: Multi-file Snap checksum
status: Implementation
discussions-to (*optional): (Http/Https URL)
author: Olaf Tomalka (@ritave)
created: 2023-11-28
---

## Abstract

A few terse sentences that are a technical summary of the proposal. Someone should be able to read this paragraph and understand the gist of this SIP.

## Motivation

The "why"

## Specification

> Indented sections like this are considered non-normative.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Steps

#### Checksum `snap.manifest.json`

> This algorithm works on `snap.manifest.json` version `0.1`.

<!-- TODO(ritave): Extract the algorithm from fast-json-stable-stringify and put it here -->

1. Delete `.result.source.shasum` field from `snap.manifest.json`.
2. Convert rest of the structure back to JSON using [`fast-json-stable-stringify@^2.1.0`](https://www.npmjs.com/package/fast-json-stable-stringify) algorithm.
3. Checksum the following string using [auxiliary file](#checksum-auxiliary-files) algorithm.

#### Auxiliary files

1. Calculate [rfc4634 SHA-256](https://datatracker.ietf.org/doc/html/rfc4634) over the raw file data.

#### Joining files

1. Sort all the files by their paths. <!-- Normalize paths over different locations from SIP-8 -->
   1. The sorting of paths is done using JavaScript's [Less Than over UTF-16 Code Units](https://tc39.es/ecma262/#sec-islessthan)
2. Calculate [SHA-256 checksum of each file separately](#checksum-auxiliary-files).
3. Concatenate all the checksums into one buffer and SHA-256 that buffer.
4. Encode the buffer using [RFC4648, Section 4: Base64 Encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-4) algorithm.

## Implementation

> [Standardized implementation](../assets/sip-x/implementation.ts)

## Test vectors

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
