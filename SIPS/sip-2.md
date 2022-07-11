---
sip: 2
title: Snap Keyrings
status: Review
discussions-to: https://github.com/MetaMask/SSIPs/discussions/10
category: Blockchain
author: Olaf Tomalka (@ritave), Muji (@tmpfs)
created: 2022-06-10
---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Abstract](#abstract)
- [Motivation](#motivation)
- [Specification](#specification)
  - [Language](#language)
  - [Common types](#common-types)
  - [DApp Developer](#dapp-developer)
  - [Application Routing](#application-routing)
  - [Snap Developer](#snap-developer)
    - [Manifest](#manifest)
    - [Snap](#snap)
      - [Lifecycle](#lifecycle)
      - [Feature discovery](#feature-discovery)
      - [Data races and account consistency](#data-races-and-account-consistency)
- [History](#history)
- [Copyright](#copyright)

## Abstract

This SIP proposes a way for Snaps to programmatically expose their blockchain account management capabilities that can be used by wallets to enrich their UI and used by DApp developers without needing to know how the wallet implements support for specific blockchain.

Example use-cases are Ethereum Smart Contract Accounts (Multisig) or Bitcoin Accounts

## Motivation

One of the main use-cases for Snaps is adding more protocols to Blockchain wallets. In current state, Snaps can't expose their capabilities to wallets, and DApp developers need to talk with the Snap directly. This SIP tries to improve the usability of Snaps by allowing wallets to integrate Snap accounts into it's own UI, and allow DApp developers to seamlessly talk to specific blockchains as if talking directly to the wallet itself, not knowing how the wallet handles such requests.

## Specification

> Formal specifications are written in Typescript and JSON schema version 2020-12. Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs)

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Common types

The below common types are used throughout the specification

```typescript
type ChainId = string;
type AccountId = string;

interface RequestArguments {
  method: string;
  params: unknown[];
}

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [prop: string]: Json };
```

- `ChainId` strings MUST be [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) Chain ID.

  The Regular Expression used to validate Chain IDs by the wallet SHOULD be:

  ```typescript
  const chainIdValidation = /^[-a-z0-9]{3,8}:[-a-zA-Z0-9]{1,32}$/;
  ```

- `AccountId` strings MUST be fully qualified [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md) Account ID.

  The Regular Expression used to validate Account IDs by the wallet SHOULD be:

  ```typescript
  const accountIdValidation =
    /^(?<chainId>[-a-z0-9]{3,8}:[-a-zA-Z0-9]{1,32}):(?<accountAddress>[a-zA-Z0-9]{1,64})$/;
  ```

- `RequestArguments` are used by both DApp and the Snap.

### DApp Developer

The wallet implementation SHOULD support [WalletConnect v2.0](https://docs.walletconnect.com/2.0/) protocol.

Wallet MAY also inject into DApp a global provider `window.blockchain` that directly communicates with the wallet instead of using relay servers of WalletConnect v2.0. The optional provider MUST minimally implement following API:

```typescript
interface Namespace {
  accounts: AccountID[];
  methods: string[];
  events: string[];
}

interface Session {
  namespaces: Record<string, Namespace>;
}

interface ConnectArguments {
  requiredNamespaces: {
    [namespace: string]: {
      chains: ChainId[];
      methods?: string[];
      events?: string[];
    };
  };
}

interface Provider {
  connect(args: ConnectArguments): Promise<{ approval: Promise<Session> }>;
  request(args: { chainId: ChainId; request: RequestArguments }): Promise<any>;

  on(eventName: string, listener: (...args: unknown[]) => void): this;
  once(eventName: string, listener: (...args: unknown[]) => void): this;
  removeListener(
    eventName: string,
    listener: (...args: unknown[]) => void
  ): this;
  removeAllListeners(eventName: string): this;
}

declare global {
  const blockchain: Provider;
}
```

The above API is a minimal API based on WalletConnect v2.0 Sign API, that skips the bridge server functionality. All operations SHOULD behave the same as WalletConnect v2.0

The wallet MUST support at least one of WalletConnect v2.0 or the injected provider.

### Application Routing

Requests (`blockchain.request(/*...*/)`) made by the DApp using WalletConnect v2.0 or the injected provider are forwarded to Snap's `module.exports.keyring.handleRequest(/*...*/)` method. See [below for Snap details](#snap)

Wallet implementation hides the details of how the requests are routed from the DApp to Snaps. During initial connection of the DApp to the Wallet using `provider.connect()` call, the wallet finds Snaps that can support requested functionality using below algorithm.

1. Wallet splits connection arguments into namespaces.
2. For each namespace, the wallet finds an installed Snap that supports all requested chains, methods and events.
   1. If there are multiple such Snaps, the choice, which one of those to use, is undefined and implementation dependent.
   2. Support for a namespace MUST NOT be split between multiple Snaps. For example, one Snap can't support one chain while other Snap supports second chain.
3. The wallet returns information of supported namespaces back to the DApp inside a `Session` object. The amount of supported namespaces MAY be smaller than the amount of requested namespaces.

If a user removes a Snap from wallet, removing any functionality that is provided to the DApp through an open session, such session MUST be invalidated.

### Snap Developer

#### Manifest

This SIP proposes to add a new permission to the Snap Manifest named `snap:keyring`. The permission would describe the allowed keyring capabilities of the Snap.

> The schema for the permission [can be found in assets](../assets/SIP/sip-2/permission.schema.json).

An example usage of above permission inside `snap.manifest.json`

```json
{
  "initialPermissions": {
    "snap:keyring": {
      "namespaces": {
        "eip155": {
          "methods": [
            "eth_signTransaction",
            "eth_accounts",
            "eth_sign",
            "personal_sign",
            "eth_signTypedData"
          ],
          "events": ["accountsChanged"],
          "chains": [
            {
              "id": "eip155:1",
              "name": "Ethereum (Mainnet)"
            }
          ]
        },
        "bip122": {
          "methods": ["signPBST", "getExtendedPublicKey"],
          "chains": [
            {
              "id": "bip122:000000000019d6689c085ae165831e93",
              "name": "Bitcoin (Mainnet)"
            },
            {
              "id": "bip122:000000000933ea01ad0ee984209779ba",
              "name": "Bitcoin (Testnet)"
            }
          ]
        }
      }
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
interface SnapKeyring {
  getAccounts(): Promise<AccountId[]>;
  handleRequest(
    chainId: ChainId,
    origin: string,
    request: RequestArguments
  ): Promise<Json>;
  on(
    chainId: ChainId,
    eventName: string,
    eventArgs: unknown[],
    listener: (...args: unknown[]) => void
  ): string;
  off(eventHandle: string): void;

  addAccounts?(chainId: ChainId, count: number): Promise<AccountId[]>;
  removeAccount?(accountId: AccountId): Promise<void>;

  importAccount?(chainId: ChainId, data: Json): Promise<AccountId>;
  exportAccount?(accountId: AccountId): Promise<Json>;
}
```

- Required
  - `getAccounts()` - Returns a list of all created accounts of all supported chains.
  - `handleRequest()` - The main way DApps can communicate with the Snap. The returned data MUST be JSON serializable.
  - `on()` - The wallet will use this function to register callbacks for events declared in permission specification. The Snap MUST return a unique string representing that specific event subscription.
  - `off()` - The wallet will use this function to unsubscribe from events. The argument passed is one of the handles returned by `on()`.
- Creation
  - `addAccounts?()` - Creates a `count` of new accounts.
  - `removeAccount?()` - Removes specific account.
- Importing
  - `importAccount?()` - Imports an account of supported chain type into the keyring. The data is Snap-specific. The data format MUST be JSON serializable, and SHOULD be in the same format as the one returned from `exportAccount()`.
  - `exportAccount?()` - Returns Snap-specific data that, on it's own, is enough to recreate that specific account. The data format MUST be JSON serializable, and SHOULD be the same as one passed to `importAccount()`.

The Snaps SHOULD implement all methods inside a specific group that it wants to support (such as "Creation"), instead of implementing only some methods. The wallet MAY disable functionality of a specific group if not all methods inside that group are implemented by the Snap.

Generally the Snap MAY NOT need to check the consistency of provided `ChainId` and `AccountId` parameters. The wallet MUST only route accounts and chains that are confirmed to be existing inside the Snap, either by only using Chain Ids from the permission or by getting account list beforehand using `getAccounts()`.

##### Lifecycle

As long as there are open sessions with active event subscriptions (for example `blockchain.on('accountsChanged', /*...*/)`), the wallet MUST keep the Snap running. The Snap MAY be shut down if there are no DApp event subscriptions or no DApp sessions are open.

##### Feature discovery

Many methods in `SnapKeyring` are optional, since some operations are not possible on different account types. For example, Smart Contract based Multisig wallets can't sign messages. The wallet will initialize the keyring class and check for existence of specific methods. The wallet SHOULD do that check only once during initialization of the Snap. That means if methods are added dynamically, they won't be discovered and that functionality won't be available.

##### Data races and account consistency

Currently, Snaps can get multiple RPC requests before previous ones finish, developers generally avoid consistency problems by using packages such as `async-mutex`. For example, calling in quick succession `getAccounts()` and `removeAccount()` could result in data race where account is removed before a complete list is returned, thus returning an already deleted account. Since Keyrings hold sensitive data and it's of top most importance their consistency is maintained, the implementation SHOULD ensure the linearity of the calls to the Keyring. This means that the implementation SHOULD wait for the first call to finish before calling another method. This most likely will be implemented using a queue of waiting commands. The implementation MAY limit the size of such queue and reject additional requests outright.

The implementation MAY also hold it's own copy of accounts of a Snap to avoid multiple `getAccounts()` calls. For example, instead of calling `getAccounts()` again after `removeAccount()`, the implementation MAY remove such account after calling `removeAccount()` from it's own copy without consulting Snap for newest list of accounts.

## History

The Keyring interface has been inspired by Keyring protocol used in Metamask.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
