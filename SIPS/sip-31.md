---
sip: 31
title: Client-only RPC Entrypoint
status: Draft
author: Daniel Rocha (@danroc)
created: 2025-03-19
---

## Abstract

This proposal introduces a new entrypoint, `onClientRequest`, allowing Snaps to
expose a handler that can only be called by the client.

While the request `origin` can currently be used to differentiate requests from
clients and dapps, this new entrypoint increases separation and minimizes
the risks associated with `origin` spoofing or request routing bugs.

## Motivation

Currently, Snaps rely on the `origin` field of incoming requests to
differentiate whether a request originates from the client, another
Snap, or an external dapp. However, this approach has potential risks:

- **Origin Spoofing**: Bugs or vulnerabilities in request validation could
  allow dapps to masquerade as the client or a different dapp.

- **Unintended Exposure**: If a Snap processes requests without strict
  validation, it may unintentionally expose methods to dapps or other Snaps
  that are meant only for the client.

- **Cleaner Separation**: Having a dedicated entrypoint for client requests
  enforces stricter request isolation at the API level.

By introducing `onClientRequest`, we ensure that Snaps can define handlers
exclusively accessible by the client, reducing potential attack vectors.

## Specification

This proposal introduces a new OPTIONAL handler function, `onClientRequest`,
which a Snap MAY implement.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written
in uppercase in this document are to be interpreted as described in [RFC
2119](https://www.ietf.org/rfc/rfc2119.txt).

### Snap Implementation

#### On Client Request

This specification introduces to the Snap Platform a dedicated handler that
Snaps MAY implement to process JSON-RPC requests originating exclusively from
the client.

Example:

```typescript
import { OnClientRequestHandler } from "@metamask/snaps-sdk";

export const onClientRequest: OnClientRequestHandler = async ({
  request,
}) => {
  const result = /* Handle `request` */;
  return result;
};
```

The type of the `onClientRequest` handler is:

```typescript
type OnClientRequestHandler = (
  args: OnClientRequestArguments,
) => Promise<OnClientRequestResponse>;
```

The type for an `onClientRequest` handler function’s arguments is:

```typescript
type OnClientRequestArguments = {
  request: JsonRpcRequest;
};
```

The type for an `onClientRequest` handler function’s return value is:

```typescript
type OnClientRequestResponse = Json;
```

#### Behavior

- The client MUST ensure that it is the origin of a request before invoking
  `onClientRequest`.

- Requests from other origins MUST be rejected.

- If a Snap does not implement `onClientRequest`, the client MUST throw an
  exception for requests directed to that entrypoint, regardless of the origin.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
