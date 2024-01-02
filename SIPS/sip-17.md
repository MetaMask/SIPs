---
sip: 17
title: Request/Response Middleware
status: Draft
author: Ronny Esterluss <ronny.esterluss@hoprnet.org> (@esterlus), Tino Breddin <tino.breddin@hoprnet.org> (@tolbrino)
created: 2023-11-15
---

## Abstract

Introduce a new endowment that would allow a snap to register itself as a request middleware.

## Motivation

We want to build a snap that gives users full privacy when doing JSON RPC calls using Metamask.
This snap will leverage [RPCh](https://rpch.net/) to relay requests and
improve the IP-privacy of all RPC calls.
The original JSON RPC provider, which is configured in Metamask for the active
network, will still be used as the target of the request. However the request
will be relayed through [HOPRNet](https://network.hoprnet.org/) first before
finally sent to the RPC provider.

## Specification

> Formal specifications are written in Typescript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as
described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snaps permissions

This SIP specifies a permission named `endowment:request-middleware`.
The permission signals to the platform that the snap wants to act as
request middleware and modify the original requests headers, body and/or target.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:request-middleware": {}
  }
}
```

The order in which the middleware will be called is not guaranteed and may vary.

3 special types of middlewares are supported:

1. Middleware entry
   Is guaranteed to be called first in the middleware chain. Only a single entry
   can be enabled.
2. Middleware exit
   Is guaranteed to be called last in the middleware chain. Only a single exit
   can be enabled.
3. Execution point
   Is guaranteed to be called after the entire middleware chain. Only a single
   execution point can be enabled. This middleware will execute the request
   directly and return the response.

The special middleware types can be enabled through permission parameters which
are set to `false` by default:

```json
{
  "initialPermissions": {
    "endowment:request-middleware": {
      "isEntry": false,
      "isExit": false,
      "isExecutionPoint": false
    }
  }
}
```

### Snaps exports

This SIP specifies 2 new exported event handlers: `onRequest` and
`onRequestTermination`.
The correct event handler MUST be called whenever Metamask makes an outgoing
JSON RPC request depending on the permission configuration of the middleware.

#### Parameters

An object containing the following fields:

* `request`: the request containing headers and body data

`headers`: This parameter MUST be present and be a flat object container key/value mappings.
`body`: This parameter MUST be present and MUST adhere to the official [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification).

* `provider`: the target JSON RPC provider url

This parameter SHOULD be present. It contains the RPC URL of the intented RPC Provider (e.g. `https://mainnet.infura.io/v3/`).
Metamask SHOULD use the configured RPC provider in the currently selected network.

#### Returns

`onRequest`: A promise resolving to the updated request object.
`onRequestTermination`: A promise resolving to the response of the request or rejecting with an error.

#### Examples

```typescript
import { OnRequestHandler, OnRequestTerminationHandler } from '@metamask/snaps-types';
import RPChSDK from '@rpch/sdk';

const sdk = new RPChSDK("<ClientId>");

export const onRequest: OnRequestHandler = async ({
  request,
  provider,
}) => {
  request.headers["CUSTOM-HEADER"] = "example value";
  return request;
};

export const onRequest: OnRequestTerminationHandler = async ({
  request,
  provider,
}) => {
  return sdk.send(request, { provider });
};
```

#### Type definitions

```typescript

type OnRequestHandler =
  (args: { request: Request, provider: string }) => Promise<Request>;

type OnRequestTerminationHandler =
  (args: { request: Request, provider: string }) => Promise<Response>;

type Request = {
  headers: object;
  body: JSONRPCRequest;
};

type JSONRPCRequest = {
  readonly jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any[] | object;
};

type Response = {
  headers: object;
  body: JSONRPCResponse;
  status: number;
};

type JSONRPCResponse = JSONRPCResult | JSONRPCError;

type JSONRPCResult = {
  readonly jsonrpc: '2.0';
  id?: string | number | null;
  result: any;
};

type JSONRPCError = {
  readonly jsonrpc: '2.0';
  id?: string | number | null;
  error: {
    code: number;
    message: string;
    data?: any;
  };
};
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
