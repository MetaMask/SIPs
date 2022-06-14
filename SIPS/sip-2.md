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
      - [Feature discovery](#feature-discovery)
      - [Data races and account consistency](#data-races-and-account-consistency)
- [History](#history)
- [Copyright](#copyright)

## TODO

- **TODO(@ritave): how should Keyring stored it's data? Should it be using `snap_manageState`?**
- **TODO(@ritave): Multisig Smart Contracts have no reference in CAIP-2, how should they be referenced?**
- **TODO(@ritave): Ethereum Smart Contracts Multisig doesn't have a private key, how should API look in that situation?**
- **TODO(@ritave): CAIPs don't have a standard on how to expose the provider to the DApp developer. Make one**
- **TODO(@ritave): Should sign/decrypt message be included? That functionality could be created using routing of rpc requests later on**

## Abstract

This SIP proposes a way for Snaps to programmatically expose their blockchain account management capabilities that can be used by wallets to enrich their UI and used by DApp developers without needing to know how the wallet implements support for specific blockchain.

Example use-cases are Ethereum Smart Contract Accounts (Multisig) or Bitcoin Accounts

## Motivation

One of the main use-cases for Snaps is adding more protocols to Blockchain wallets. In current state, Snaps can't expose their capabilities to wallets, and DApp developers need to talk with the Snap directly. This SIP tries to improve the usability of Snaps by allowing wallets to integrate Snap accounts into it's own UI, and allow DApp developers to seamlessly talk to specific blockchains as if talking directly to the wallet itself, not knowing how the wallet handles such requests.

## Specification

> Formal specifications are written in Typescript, JSON and JSON schema version 2020-12. Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs)

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

> The schema for the permission [can be found in assets](../assets/SIP/sip-2/permission.schema.json).

An example usage of above permission inside `snap.manifest.json`

```json
{
  "initialPermissions": {
    "snap:keyring": {
      "blockchain": [
        {
          "id": "eip155:1",
          "name": "Ethereum (Mainnet)"
        },
        {
          "id": "bip122:000000000019d6689c085ae165831e93",
          "name": "Bitcoin (Mainnet)"
        }
      ]
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
  getAccounts(): Promise<AccountId[]>;
  signTransaction(accountId: AccountId, data: unknown): Promise<unknown>;

  addAccounts?(blockchainId: BlockchainId, count: number): Promise<AccountId[]>;
  removeAccount?(accountId: AccountId): Promise<void>;

  importAccount?(blockchainId: BlockchainId, data: unknown): Promise<AccountId>;
  exportAccount?(accountId: AccountId): Promise<unknown>;

  signMessage?(accountId: AccountId, data: unknown): Promise<unknown>;
  decryptMessage?(accountId: AccountId, data: unknown): Promise<unknown>;
}
```

- Types
  - `BlockchainId` strings MUST be CAIP-2 Blockchain ID.
  - `AccountId` strings MUST be fully qualified CAIP-10 Account ID. The Regular Expression used to validate Account IDs by the wallet SHOULD be:
    ```typescript
    const accountIdValidation =
      /^(?<blockchainId>[-a-z0-9]{3,8}:[-a-zA-Z0-9]{1,32}):(?<accountAddress>[a-zA-Z0-9]{1,64})$/;
    ```
- Required
  - `getAccounts()`
  - `signTransaction()`
- Creation
  - `addAccounts?()`
  - `removeAccount?()`
- Importing
  - `importAccount?()`
  - `exportAccount?()`
- Messages
  - `signMessage?()`
  - `decryptMessage?()`

The Snaps SHOULD implement all methods inside a specific group that it wants to support (such as `Creation`), instead of implementing only some methods. The wallet MAY disable functionality of specific group if not all methods inside that group are implemented by the Snap.

Generally the Snap MAY NOT need to check the consistency of provided `BlockchainId` and `AccountId` parameters. The wallet MUST only route accounts and blockchains that are confirmed to be existing inside the Snap, either by only using blockchain Ids from the permission or by getting account list beforehand using `getAccounts()`.

The wallet SHOULD check for consistency of returned `AccountId` from the Snap. The blockchainId part SHOULD match one of specified inside the permission and the one requested in the method parameters of the call.

##### Feature discovery

Many methods in `SnapKeyring` are optional, since some operations are not possible on different account types. For example, Smart Contract based Multisig wallets can't sign messages. The wallet will initialize the keyring class and check for existence of specific methods. The wallet SHOULD do that check only once during initialization of the Snap. That means if methods are added dynamically, they won't be discovered and that functionality won't be available.

##### Data races and account consistency

Currently, Snaps can get multiple RPC requests before previous ones finish, developers generally avoid consistency problems by using packages such as `async-mutex`. For example, calling in quick succession `getAccounts()` and `removeAccount()` could result in data race where account is removed before a complete list is returned, thus returning an already deleted account. Since Keyrings hold sensitive data and it's of top most importance their consistency is maintained, the implementation SHOULD ensure the linearity of the calls to the Keyring. This means that the implementation SHOULD wait for the first call to finish before calling another method. This most likely will be implemented using a queue of waiting commands. The implementation MAY limit the size of such queue and reject additional requests outright.

The implementation MAY also hold it's own copy of accounts of a Snap to avoid multiple `getAccounts()` calls. For example, instead of calling `getAccounts()` again after `removeAccount()`, the implementation MAY remove such account after calling `removeAccount()` from it's own copy without consulting Snap for newest list of accounts.

## History

The Keyring interface has been inspired by Keyring protocol used in Metamask.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
