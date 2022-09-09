---
sip: 2
title: Snap Keyrings
status: Implementation
discussions-to: https://github.com/MetaMask/SSIPs/discussions/10
author: Olaf Tomalka (@ritave), Muji (@tmpfs)
created: 2022-06-10
---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Abstract](#abstract)
- [Motivation](#motivation)
- [Specification](#specification)
  - [Language](#language)
  - [Definitions](#definitions)
  - [Common types](#common-types)
  - [DApp Developer](#dapp-developer)
  - [Application Routing](#application-routing)
  - [Snap Developer](#snap-developer)
    - [Manifest](#manifest)
    - [Snap](#snap)
      - [Lifecycle](#lifecycle)
      - [Feature discovery](#feature-discovery)
      - [Account consistency](#account-consistency)
- [History](#history)
- [Copyright](#copyright)

## Abstract

This SIP proposes a way for snaps to programmatically expose their blockchain account management capabilities that can be used by wallets to enrich their UI and used by DApp developers without needing to know how the wallet implements support for specific blockchain.

Example use-cases are Ethereum Smart Contract Accounts (Multisig) or Bitcoin Accounts

## Motivation

One of the main use-cases for snaps is adding more protocols to Blockchain wallets. In current state, snaps can't expose their capabilities to wallets, and DApp developers need to talk with the snap directly. This SIP tries to improve the usability of snaps by allowing wallets to integrate snap accounts into its own UI, and allow DApp developers to seamlessly talk to specific blockchains as if talking directly to the wallet itself, not knowing how the wallet handles such requests.

## Specification

> Formal specifications are written in Typescript and [JSON schema version 2020-12](https://json-schema.org/draft/2020-12/json-schema-core.html). Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs)

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Definitions

> This section is non-normative

- `ChainId` - a [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) string. It identifies a specific chain in all of possible blockchains.
  - `ChainId` consists of a `Namespace` and a `Reference`
    - `Namespace` - A class of similar blockchains. For example EVM-based blockchains.
    - `Reference` - A way to identify a concrete chain inside a `Namespace`. For example Ethereum Mainnet or Polygon.
- `AccountId` - a [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md) string. It identifies a specific account on a specific chain.
  - `AccountId` consists of a `ChainId` and `account_address`
    - `ChainId` is a [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) string defined above.
    - `account_address` is a string whose format is chain-specific. Without the ChainId part it is ambiguous and so is not used alone in this SIP.

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

- `ChainId` strings MUST be [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) Chain Id.

  The Regular Expression used to validate Chain IDs by the wallet SHOULD be:

  ```typescript
  const chainIdValidation =
    /^(?<namespace>[-a-z0-9]{3,8}):(?<reference>[-a-zA-Z0-9]{1,32})$/;
  ```

- `AccountId` strings MUST be fully qualified (including `ChainId` part) [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md) Account Id.

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

/**
 * One of events requested in the snap manifest.
 */
interface Event {
  name: string;
  data: unknown;
}

interface Provider {
  connect(args: ConnectArguments): Promise<{ approval(): Promise<Session> }>;
  request(args: { chainId: ChainId; request: RequestArguments }): Promise<any>;

  on(
    eventName: "session_event",
    listener: (arg: { params: { event: Event; chainId: ChainId } }) => void
  ): this;
  on(eventName: string, listener: (...args: unknown[]) => void): this;
  once(
    eventName: "session_event",
    listener: (arg: { params: { event: Event; chainId: ChainId } }) => void
  ): this;
  once(eventName: string, listener: (...args: unknown[]) => void): this;
  removeListener(eventName: string, listener: Function): this;
  removeAllListeners(eventName: string): this;
}

declare global {
  const blockchain: Provider;
}
```

The above API is a minimal API based on WalletConnect v2.0 Sign API, that skips the bridge server functionality and is transport protocol independent. All operations SHOULD behave the same as WalletConnect v2.0.

The wallet MUST support at least one of WalletConnect v2.0 or the injected provider.

### Application Routing

Requests (`blockchain.request(/*...*/)`) made by the DApp using WalletConnect v2.0 or the injected provider are forwarded to snap's `module.exports.keyring.handleRequest(/*...*/)` method. See [below for snap details](#snap)

Wallet implementation hides the details of how the requests are routed from the DApp to snaps. During initial connection of the DApp to the Wallet using `provider.connect()` call, the wallet finds snaps that can support requested functionality using below algorithm.

1. Wallet splits connection arguments into namespaces.
2. For each namespace, the wallet finds an installed snap that supports all requested chains, methods and events.
   1. If there are multiple such snaps, the choice, which one of those to use, is undefined and implementation dependent.
3. The wallet returns information of supported namespaces back to the DApp inside a `Session` object. The amount of supported namespaces MAY be smaller than the amount of requested namespaces.

If a user removes a snap from wallet, removing any functionality that is provided to the DApp through an open session, such session MUST be invalidated.

### Snap Developer

#### Manifest

This SIP proposes to add a new permission to the Snap Manifest named `snap_keyring`. The permission would describe the allowed keyring capabilities of the snap.

> The schema for the permission [can be found in assets](../assets/sip-2/permission.schema.json).

An example usage of above permission inside `snap.manifest.json`

```json
{
  "initialPermissions": {
    "snap_keyring": {
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

A snap requesting `snap_keyring` permission SHOULD expose a `keyring` export using CommonJS.

```typescript
module.exports.keyring = new SnapKeyring();
```

The interface for the exported object is as follows

```typescript
interface SnapKeyring {
  getAccounts(): Promise<AccountId[]>;
  handleRequest(data: {
    chainId: ChainId;
    origin: string;
    request: RequestArguments;
  }): Promise<Json>;
  on(
    data: {
      chainId: ChainId;
      origin: string;
      eventName: string;
    },
    listener: (...args: unknown[]) => void
  ): void;
  off(data: { chainId: ChainId; origin: string; eventName: string }): void;

  addAccount?(chainId: ChainId): Promise<AccountId>;
  removeAccount?(accountId: AccountId): Promise<void>;

  importAccount?(chainId: ChainId, data: Json): Promise<AccountId>;
  exportAccount?(accountId: AccountId): Promise<Json>;
}
```

- Required
  - `getAccounts()` - Returns a list of all managed accounts of all supported chains.
  - `handleRequest()` - The main way DApps can communicate with the snap. The returned data MUST be JSON serializable.
  - `on()` - The wallet will use this function to register callbacks for events declared in permission specification. The wallet SHALL register at most one listener per each unique `[origin, chainId, eventName]` tuple.
  - `off()` - The wallet will use this function to unsubscribe from events registered using `on()`.
- Creation
  - `addAccounts?()` - Creates new account.
  - `removeAccount?()` - Removes specific account.
- Importing
  - `importAccount?()` - Imports an account of supported chain type into the keyring. The data is Snap-specific. The data format MUST be JSON serializable, and SHOULD be in the same format as the one returned from `exportAccount()`.
  - `exportAccount?()` - Returns snap-specific data that, on its own, is enough to recreate that specific account. The data format MUST be JSON serializable, and SHOULD be the same as one passed to `importAccount()`.

The snaps SHOULD implement all methods inside a specific group that it wants to support (such as "Creation"), instead of implementing only some methods. The wallet MAY disable functionality of a specific group if not all methods inside that group are implemented by the snap.

The snap MAY NOT need to check the consistency of provided `ChainId` and `AccountId` parameters. The wallet MUST only route accounts and chains that are confirmed to be existing inside the snap, either by only using Chain Ids from the permission or by getting account list beforehand using `getAccounts()`.

##### Lifecycle

As long as there are open sessions with active event subscriptions (for example `blockchain.on('accountsChanged', /*...*/)`), the wallet MUST keep the snap running. The snap MAY be shut down if there are no DApp event subscriptions or no DApp sessions are open.

##### Feature discovery

Many methods in `SnapKeyring` are optional, since some operations are not possible on different account types. For example, Smart Contract based Multisig wallets can't sign messages. The wallet will initialize the keyring class and check for existence of specific methods. The wallet SHOULD do that check only once during initialization of the snap. That means if methods are added dynamically, they won't be discovered and that functionality won't be available.

##### Account consistency

The implementation MAY also hold its own copy of accounts of a snap to avoid multiple `getAccounts()` calls. For example, instead of calling `getAccounts()` again after `removeAccount()`, the implementation MAY remove such account after calling `removeAccount()` from its own copy without consulting snap for newest list of accounts.

## History

The Keyring interface has been inspired by Keyring protocol used in Metamask.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
