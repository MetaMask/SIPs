---
sip: 26
title: Non-EVM protocol support
status: Draft
author: Daniel Rocha (@danroc), Frederik Bolding (@FrederikBolding), Alex Donesky (@adonesky1)
created: 2024-08-28
---

## Abstract

This SIP presents an architecture to enable Snaps to expose blockchain-specific
methods to dapps, extending MetaMask's functionality to support a multichain
ecosystem.

## Motivation

Currently, MetaMask is limited to EVM-compatible networks. This proposal aims
to empower developers, both first- and third-party, to use Snaps to add native
support for non-EVM-compatible chains within MetaMask.

## Specification

> Formal specifications are written in TypeScript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written
in uppercase in this document are to be interpreted as described in [RFC
2119](https://www.ietf.org/rfc/rfc2119.txt).

### High-Level architecture

The diagram below represents a high-level architecture of how the RPC Router
integrates inside MetaMask to allow Snaps to expose protocol methods to dapps
and the MetaMask clients.

![High-level architecture](../assets/sip-26/components-diagram.png)

- **Account Snaps**: Snaps that implement the [Keyring API][keyring-api] and are responsible
  for signing requests and managing accounts.

- **Protocol Snaps**: Snaps that implement protocol methods that do not require
  an account to be executed.

- **RPC Router**: Native component that forwards RPC requests to the
  appropriate Protocol Snap or Account Snap.

- **Keyring Controller**: Native component responsible for forwarding signing
  requests to the appropriate keyring implementation.

- **Accounts Controller**: Native component responsible for managing accounts
  inside MetaMask. It stores all non-sensitive account information.

- **Snaps Keyring**: Native component that acts as a bridge between the
  Keyring Controller and the Account Snaps.

### Components

Here is a brief description of the components involved in this architecture
which will require to be implemented or modified.

#### RPC Router

The RPC Router will be a new native component responsible for routing JSON-RPC
requests to the appropriate Snap or keyring.

To route a request, the RPC Router MUST extract the method name and chain ID
from the request object. It then determines whether the method is supported by
a Protocol Snap or an Account Snap, with Account Snaps taking precedence over
Protocol Snaps.

If the method is supported by an Account Snap, the RPC Router forwards the
request to the Keyring Controller; otherwise, it forwards the request to the
appropriate Protocol Snap.

#### Snaps Keyring

The Snaps Keyring is an existing native component that exposes the
[snap_manageAccounts][snap-manage-accs] method, allowing Account Snaps to
register, remove, and update accounts.

For example, this code can be used by an Account Snap to register a new account
with the Account Router:

```typescript
// This will notify the Account Router that a new account was created, and the
// Account Router will register this account as available for signing requests
// using the `eth_signTypedData_v4` method.
await snap.request({
  method: "snap_manageAccounts",
  params: {
    method: "notify:accountCreated",
    params: {
      account: {
        id: "74bb3393-f267-48ee-855a-2ba575291ab0",
        type: "eip155:eoa",
        address: "0x1234567890123456789012345678901234567890",
        methods: ["eth_signTypedData_v4"],
        options: {},
      },
    },
  },
});
```

Similar events are available to notify about the removal and update of
accounts: `notify:accountRemoved` and `notify:accountUpdated`.

Additionally, the Snaps Keyring expects the Account Snap to implement the
Keyring API so it can forward signing requests to it through the
[`keyring_submitRequest`][submit-request] method.

#### Account Snaps

As part of the Keyring API, non-EVM Account Snaps MUST also implement support
for the `keyring_resolveAccountAddress` RPC method defined below. It is used
by the RPC Router to extract the address of the account that should handle
the signing request from the request object.

```typescript
type ResolveAccountAddressRequest = {
  method: "keyring_resolveAccountAddress";
  params: {
    scope: CaipChainId;
    request: JsonRpcRequest;
  };
};
```

The implementation MUST return a value of the type `{ address: string }` or `null`.

#### Protocol Snaps

Protocol Snaps implement and expose methods that do not require an account to
execute and MUST list their supported methods in their manifest file:

```json5
"initialPermissions": {
  "endowment:protocol": {
    "scopes": {
      "<chain_id_1>": {
        "methods": [
          // List of supported methods
        ],
        "notifications": [
          // List of supported notifications
        ]
      }
    }
  }
}
```

Additionally protocol Snaps MUST implement the `onProtocolRequest` handler:

```typescript
import { OnProtocolRequestHandler } from "@metamask/snap-sdk";

export const onProtocolRequest: OnProtocolRequestHandler = async ({
  origin,
  scope,
  request,
}) => {
  // Return protocol responses
};
```

The interface for an `onProtocolRequest` handler function’s arguments is:

```typescript
interface OnProtocolRequestArguments {
  origin: string;
  scope: CaipChainId;
  request: JsonRpcRequest;
}
```

`origin` - The origin making the protocol request (i.e. a dapp).

`scope` - The scope of the request, currently a chain ID as defined by the [CAIP-2 specification][caip-2].

`request` - A `JsonRpcRequest` containing strictly JSON-serializable values.

Any JSON-serializable value is allowed as the return value for `onProtocolRequest`.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).

[keyring-api]: https://github.com/MetaMask/accounts/tree/main/packages/keyring-api
[snap-manage-accs]: https://docs.metamask.io/snaps/reference/snaps-api/#snap_manageaccounts
[submit-request]: https://docs.metamask.io/snaps/reference/keyring-api/account-management/#keyring_submitrequest
[caip-2]: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
