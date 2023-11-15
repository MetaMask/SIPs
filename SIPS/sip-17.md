---
sip: (To be assigned)
title: JSON RPC provider
status: Draft
author: Ronny Esterluss <ronny.esterluss@hoprnet.org> (@esterlus)
created: 2023-11-15
---

## Abstract

Introduce a new endowment that would allow a snap to intercept outgoing traffic and act as a JSON RPC Provider according to [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification).

## Motivation

We want to build a snap that gives users full privacy when doing JSON RPC calls using Metamask.
This snap will leverage the power of [RPCh](https://rpch.net/).
The original JSON RPC provider is still the target of the request, but the request will be routed through [HOPRNet](https://network.hoprnet.org/) to eliminate Metadata.


## Specification

> Formal specifications are written in Typescript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snaps permissions

This SIP specifies a permission named `endowment:json-rpc-provider`.
The permission signals to the platform that the snap wants to act as a JSON RPC Provider and intercept outgoing JSON RPC requests.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:json-rpc-provider": {}
  }
}
```

### Snaps exports

This SIP specifies a new exported event handler `onOutgoingJSONRpcRequest`.
The event handler MUST be called whenever Metamask makes an outgoing JSON RPC request.

#### Parameters

An object containing:

request - The JSON-RPC request
provider - The target JSON RPC Provider

* request

This parameter MUST be present and MUST adhere to the official [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification).

* provider

This parameter SHOULD be present. It contains the RPC URL of the intented RPC Provider (e.g. `https://mainnet.infura.io/v3/`).
Metamask SHOULD use the configured RPC provider in the currently selected network.

#### Returns

A promise resolving to the response of the request or rejecting with an error.

#### Example

```typescript
import { OnOutgoingJSONRpcRequestHandler } from '@metamask/snaps-types';
import RPChSDK from '@rpch/sdk';

const sdk = new RPChSDK("<ClientId>");

export const onOutgoingJSONRpcRequest: OnOutgoingJSONRpcRequestHandler = async ({
  request,
  provider,
}) => {
    return sdk.send(request, { provider });
};
```

#### Type definitions

```typescript

type OnOutgoingJSONRpcRequestHandler =
  (args: { request: JSONRPCRequest, provider: string }) => Promise<JSONRPCResponse>;

type JSONRPCRequest = {
    readonly jsonrpc: '2.0';
    id?: string | number | null;
    method: string;
    params?: any[] | object;
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
