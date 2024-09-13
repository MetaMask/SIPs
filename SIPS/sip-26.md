---
sip: 26
title: Account Router Snaps
status: Draft
author: Daniel Rocha (@danroc)
created: 2024-08-28
---

## Abstract

This SIP proposes a new API to be implemented by a new Account Router, allowing
the forwarding of signing requests to the appropriate account Snap (i.e., Snaps
that implement the [Keyring API][keyring-api]).

## Motivation

The Keyring API is being modified to support non-EVM chains. However, a
challenge arises in identifying the correct account Snap that should receive
the signing request, as this information is often only obtainable from the
request itself, which varies based on method and chain.

## Specification

> Formal specifications are written in TypeScript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written
in uppercase in this document are to be interpreted as described in [RFC
2119](https://www.ietf.org/rfc/rfc2119.txt)

### High-level architecture

The diagram below represents a high-level architecture of how the Account
Router integrates with the RPC Router discussed in SIP-25, Account Snaps, and
Protocol Snaps.

![High-level architecture](../assets/sip-26/components-diagram.png)

- **Account Snaps**: Snaps that implement the Keyring API, and are responsible
  for signing requests and managing accounts.

- **Protocol Snaps**: Snaps that implement protocol methods that don't require
  an account to be executed.

- **RPC Router**: Native component that forwards non-signing requests to the
  appropriate Protocol Snap or native implementation.

- **Account Router**: Native component that forwards signing requests to the
  appropriate Account Snap or native implementation.

- **Account Address Resolution Snaps**: Snaps that implement the
  `resolveAddress` method to extract the account address from the request
  object.

### Account Router

The Account Router exposes the [`snap_manageAccounts`][snap-manage-accs] method
to allow account Snaps to register, remove, and update accounts.

For example, this code can be used by an Account Snap to register a new account
with the Account Router:

```typescript
// This will notify the Account Router that a new account was created, and the
// Account Router will register this account as available for signing requests
// using the `eth_signTypedData_v4` method.
await snap.request({
  method: 'snap_manageAccounts',
  params: {
    method: 'notify:accountCreated',
    params: {
      account: {
          id: '74bb3393-f267-48ee-855a-2ba575291ab0',
          type: 'eip155:eoa',
          address: '0x1234567890123456789012345678901234567890',
          methods: ['eth_signTypedData_v4'],
          options: {},
      },
    },
  },
});
```

Similar events are available to notify about the removal and update of
accounts: `notify:accountRemoved` and `notify:accountUpdated`.

Additionally, the Account Router expects the Account Snap to implement the
Keyring API so it can forward signing requests to it through the
[`keyring_submitRequest`][submit-request] method.

### Account Address Resolution Snaps

The Account Address Resolution Snaps are responsible for extracting the account
address that should receive the signing request from the request object. This
is accomplished by exposing the `resolveAddress` method to the Account Router.

```typescript
/**
 * Returns the address of the account that should handle the signing request.
 *
 * @param request - The request object.
 * @returns The account address or `undefined` if the address could not be
 * resolved.
 */
function resolveAccountAddress(request: MultichainRequest): string | undefined;
```

There must be only one Account Resolution Snap registered per chain to prevent
ambiguity in the account resolution process.

To identify which Account Resolution Snap should be used for a given request,
Account Address Resolution Snaps should have the following endowment:

```json5
"initialPermissions": {
  "endowment:account-address-resolver": {
    "chains": [
      "<chain_id_1>",
      "<chain_id_2>",
      // ...
    ]
  }
}
```

Note that the `reference` part of the [CAIP-2][caip-2] chain ID can be a `*`
wildcard to match any chain ID of a given namespace (e.g. `eip155:*`).

### Protocol Snaps

Protocol Snaps implement and expose methods that don't require an account to be
executed.

Protocol Snaps should list their supported methods in their manifest file:

```json5
"initialPermissions": {
  "endowment:protocol-methods": {
    "chains": {
      "<chain_id_1>": [
        // List of supported methods
      ]
    }
  }
}
```

### Context object

Alongside the request object, a context object is passed along to keep internal
state related to the request. Its structure is not defined by this SIP, but a
primary use would be to keep the resolved account ID.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).

[keyring-api]: https://github.com/MetaMask/keyring-api
[snap-manage-accs]: https://docs.metamask.io/snaps/reference/snaps-api/#snap_manageaccounts
[submit-request]: https://docs.metamask.io/snaps/reference/keyring-api/account-management/#keyring_submitrequest
[caip-2]: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
