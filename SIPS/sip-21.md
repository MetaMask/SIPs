---
sip: 21
title: Snap-defined timeouts
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/128
author: Frederik Bolding (@frederikbolding)
created: 2024-01-12
---

## Abstract

This SIP describes a way for Snaps to customize the request timeouts that constrain the Snap lifecycle. Effectively allowing the Snap to opt-in to slightly longer or shorter timeouts where needed.

## Motivation

Snaps that do CPU intensive computation are currently limited by the 1 minute timeout, causing certain use-cases to be unsupportable by Snaps (e.g., computing ZK proofs). By letting Snaps customize the request timeout (within reason) for each type of handler that they expose, the Snap developer gets more control over the user experience while the Snap platform lifecycle requirements can remain strict.

## Specification

> Formal specifications are written in TypeScript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP specifies an addendum that MUST be applied to existing and future Snap handler permissions (`endowment:rpc`, `endowment:transaction-insight` etc.). The addendum is an optional caveat value called `maxRequestTime`.

The value MUST be a valid integer between `5000` (5 seconds) and `180000` (3 minutes) and specifies the request timeout for the given handler in milliseconds. If no value is provided the default timeout of 1 minute (`60000` ms) MUST be used.

The caveat is specified as follows in the manifest:

```json
{
  "initialPermissions": {
    "endowment:rpc": {
      "dapps": true,
      "snaps": true,
      "maxRequestTime": 120000
    },
    "endowment:transaction-insight": {
      "maxRequestTime": 30000
    }
  }
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
