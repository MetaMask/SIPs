---
sip: 31
title: Client-only RPC Entrypoint
status: Draft
author: Daniel Rocha (@danroc)
created: 2025-03-19
---

## Abstract

This proposal introduces a new entrypoint, `onClientRequest`, allowing Snaps to
expose a handler that can only be called by MetaMask clients.

While request `origin` is currently used to differentiate requests from
MetaMask and dapps, this new entrypoint increases separation and minimizes the
risks associated with `origin` spoofing or request routing bugs.

## Motivation

Currently, Snaps rely on the `origin` field of incoming requests to
differentiate whether a request originates from MetaMask or an external dapp.
However, this approach has potential risks:

- **Origin Spoofing**: Bugs or vulnerabilities in request validation could
  allow dApps to masquerade as MetaMask clients.

- **Unintended Exposure**: If a Snap processes requests without strict checks,
  it may inadvertently handle dapp requests intended only for MetaMask.

- **Cleaner Separation**: Having a dedicated entrypoint for MetaMask requests
  enforces stricter request isolation at the API level.

By introducing `onClientRequest`, we ensure that Snaps can define handlers
exclusively accessible by MetaMask, reducing attack vectors and improving
request security.

## Specification

> This proposal introduces a new optional handler function, `onClientRequest`,
> which a Snap can implement.

### `onClientRequest` Entrypoint

Snaps MAY define an `onClientRequest` handler with the following signature:

```typescript
type OnClientRequest = (request: JsonRpcRequest) => Promise<JsonRpcResponse>;
```

#### Parameters

- `request: JsonRpcRequest` – A JSON-RPC request object.

#### Returns

A `Promise<JsonRpcResponse>`, which resolves to a JSON-RPC response object.

#### Behavior

- MetaMask MUST ensure that the request originates from a MetaMask client
  before invoking `onClientRequest`.

- Requests from other origins MUST be rejected.

- If a Snap does not implement `onClientRequest`, the default behavior is to
  thrown an exception for any request, independent of the origin.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written
in uppercase in this document are to be interpreted as described in [RFC
2119](https://www.ietf.org/rfc/rfc2119.txt)

## Backwards compatibility

Any SIPs that break backwards compatibility MUST include a section describing
those incompatibilities and their severity. The SIP SHOULD describe how the
author plans on proposes to deal with such these incompatibilities.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
