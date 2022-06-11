---
sip: 2
title: Snap Keyrings
status: Draft
category: Blockchain
author: Olaf Tomalka (@ritave)
created: 2022-06-10
---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [TODO](#todo)
- [Abstract](#abstract)
- [Motivation](#motivation)
- [Specification](#specification)
  - [Language](#language)
  - [DApp Developer](#dapp-developer)
    - [Provider](#provider)
  - [Application Routing](#application-routing)
  - [Snap Developer](#snap-developer)
    - [Manifest](#manifest)
    - [Snap](#snap)
- [History](#history)
- [Copyright](#copyright)

## TODO

- **TODO(@ritave): how should Keyring stored it's data? Should it be using `snap_manageState`?**
- **TODO(@ritave): Multisig Smart Contracts have no reference in CAIP-2, how should they be referenced?**
- **TODO(@ritave): Ethereum Smart Contracts Multisig doesn't have a private key, how should API look in that situation?**
- **TODO(@ritave): CAIPs don't have a standard on how to expose the provider to the DApp developer. Make one**

## Abstract

This SIP proposes a way for Snaps to programmatically expose their blockchain account management capabilities that can be used by wallets to enrich their UI and used by DApp developers without needing to know how the wallet implements support for specific blockchain.

Example use-cases are Ethereum Smart Contract Accounts (Multisig), Bitcoin accounts

## Motivation

One of the main use-cases for Snaps is adding more protocols to Blockchain wallets. In current state, Snaps can't expose their capabilities to wallets, and DApp developers need to talk with the Snap directly. By exposing

## Specification

Formal specifications are written in Typescript, JSON and JSON schema version 2020-12. Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs)

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### DApp Developer

#### Provider

### Application Routing

### Snap Developer

#### Manifest

This SIP proposes to add a new permission to the Snap Manifest named `snap:keyring`. The permission would describe the allowed keyring capabilities of the Snap.

The schema for the permission is as follows

```json
{
  "title": "Keyring Permission",
  "type": "object",
  "additionalProperties": false,
  "required": ["blockchainId"],
  "properties": {
    "blockchainId": {
      "title": "Supported blockchains",
      "type": "array",
      "items": {
        "title": "Blockchain ID",
        "description": "A Blockchain ID using CAIP-2 specification",
        "type": "string",
        "pattern": "[-a-z0-9]{3,8}:[-a-zA-Z0-9]{1,32}"
      }
    }
  }
}
```

An example usage of above permission inside `snap.manifest.json`

```json
{
  "initialPermissions": {
    "snap:keyring": {
      "blockchainId": ["eip155:1", "bip122:000000000019d6689c085ae165831e93"]
    }
  }
}
```

#### Snap

A Snap requesting `snap:keyring` permission SHOULD expose a `keyring` export using CommonJS.

```typescript
module.exports.keyring = new SnapKeyring();
```

The interface for the exported object is as follows

```typescript
type BlockchainId = string;
type AccountId = string;

interface SnapKeyring {
  addAccounts(blockchainId: BlockchainId, count: number): Promise<AccountId[]>;
  getAccounts(): Promise<AccountId[]>;
  removeAccount(accountId: AccountId): Promise<void>;

  signTransaction(accountId: AccountId, data: unknown): Promise<unknown>;

  signMessage(accountId: AccountId, data: unknown): Promise<unknown>;
}
```

`BlockchainId` strings MUST be CAIP-2 Blockchain ID.

`AccountId` strings MUST be fully qualified CAIP-10 Account ID. The Regular Expression used to validate Account IDs SHOULD be:

```typescript
const accountIdValidation =
  /^(?<blockchainId>[-a-z0-9]{3,8}:[-a-zA-Z0-9]{1,32}):(?<accountAddress>[a-zA-Z0-9]{1,64})$/;
```

## History

The Keyring interface has been inspired by Keyring protocol used in Metamask.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
