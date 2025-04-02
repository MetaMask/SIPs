---
sip: 31
title: Client-only RPC Entrypoint
status: Draft
author: Daniel Rocha (@danroc)
created: 2025-03-19
---

## Abstract

This proposal introduces a new entrypoint, `onClientRequest`, allowing Snaps to
expose a handler that can only be called by clients.

While the request `origin` can currently be used to differentiate requests from
clients and dapps, this new entrypoint increases separation and minimizes
the risks associated with `origin` spoofing or request routing bugs.

## Motivation

Currently, Snaps rely on the `origin` field of incoming requests to
differentiate whether a request originates from the client or an external dapp.
However, this approach has potential risks:

- **Origin Spoofing**: Bugs or vulnerabilities in request validation could
  allow dapps to masquerade as clients.

- **Unintended Exposure**: If a Snap processes requests without strict
  validation, it may unintentionally expose to dapps methods that are meant
  only for clients.

- **Cleaner Separation**: Having a dedicated entrypoint for client requests
  enforces stricter request isolation at the API level.

By introducing `onClientRequest`, we ensure that Snaps can define handlers
exclusively accessible by clients, reducing attack vectors.

## Specification

This proposal introduces a new optional handler function, `onClientRequest`,
which a Snap MAY implement.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written
in uppercase in this document are to be interpreted as described in [RFC
2119](https://www.ietf.org/rfc/rfc2119.txt).

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

- Clients MUST ensure that they are the origin of a request before invoking
  `onClientRequest`.

- Requests from other origins MUST be rejected.

- If a Snap does not implement `onClientRequest`, the client MUST throw an
  exception for any request, regardless of the origin.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
