---
sip: 24
title: WebSocket Connections
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/142
author: Muji (@tmpfs)
created: 2024-08-08
---

## Abstract

This SIP describes a way for Snaps using the Keyring API to establish WebSocket connections.

## Motivation

Snaps that need to perform multi-party computation (MPC) for threshold signatures schemes (TSS) require sending various messages in rounds to participants over the network; MPC communication is best suited to a session-based WebSocket connection. This SIP is concerned with using WebSocket connections to sign transactions as part of the Keyring API and not the more generic use case defined in [SIP-20](/SIPS/sip-20.md).

## Specification

> Formal specifications are written in TypeScript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP specifies an addendum that MAY be applied to existing and future Snap handler permissions for `endowment:keyring`. The addendum is that the `allowedOrigins` array may contain URLs using the `wss:` or `ws:` schemes.

The caveat is specified as follows in the manifest:

```json
{
  "initialPermissions": {
    "endowment:keyring": {
      "allowedOrigins": [
        "https://tss.ac",
        "wss://relay.tss.ac"
      ]
    },
  }
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
