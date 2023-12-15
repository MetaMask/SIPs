---
sip: 20
title: External data (WebSockets and other custom data or events)
status: Draft
author: David Drazic (@david0xd)
created: 2023-12-15
---

## Abstract

This SIP proposes changes to the Snap manifest and additional request handler that allows Snap developers to implement
functionality that is invoked when external data events occur. This proposal outlines some of the details around this feature.

The purpose of the initial version of this SIP is to provide support for WebSockets.
This SIP only proposes one-way communication.
This SIP is made with extensibility in mind and can be updated to handle more external data sources (like blockchain
events, etc.).

## Motivation

Snaps are currently isolated from outside events and rely on combination of user actions or CRON jobs and fetch
endowments in order to receive extra information from independent remote sources distributed over the internet.

This proposal provides an improvement that enables one way communication between a Snap and an external data or event
source.
The idea is that the external event source sends arbitrary data to the specific controller with listener running
inside a wallet. The controller then sends the data to the Snap which runs execution of this feature specific RPC
request handler.

## Specification

> Formal specifications are written in Typescript.

### Language

The key words "MUST", "MUST NOT", "SHOULD", "RECOMMENDED" and "MAY" written in uppercase in this document are to be
interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP specifies a permission named `endowment:external-data`.

The new field can be specified as follows in a `snap.manifest.json` file:

```json
{
  "initialPermissions": {
    "endowment:external-data": [
      {
        "type": "websocket",
        "url": "wss://example.com/binary/endpoint",
        "dataType": "binary"
      },
      {
        "type": "websocket",
        "url": "wss://example.com/text/endpoint",
        "dataType": "text"
      },
      {
        "type": "blockchain",
        "chainId": "eip155:1",
        "events": [
          "block"
        ]
      }
    ]
  }
}
```

### Permission caveats

Each caveat object MUST have `type` property that SHOULD be `websocket` or `blockchain`.
If the `type` is `websocket`then the caveat MUST have `url` and `dataType` properties.
The `url` MUST be string.
The `dataType` MUST be string that MUST be `"binary"` or `"text"`.
The `chainId` MUST be string that represents supported blockchain.
The `events` SHOULD be an array of strings which represent name of the events for subscription.

- `type` property represents the type of data source.
- `url` is the WebSocket URL.
- `dataType` is type of data that WebSocket returns.
- `chainId` is the blockchain ID.
- `events` is the array of events to subscribe.

The caveats MUST NOT have duplicate objects with the same `url` or `chainId` properties.

The `url` MUST start with `wss://` which is a protocol indicator for secure WebSocket connection.

### Snap implementation (request handler)

This SIP proposes the following RPC request handler to execute implemented functionality for external data events:

#### OnExternalDataHandler

Example:
```typescript
import { OnExternalDataHandler } from '@metamask/snaps-types';
import { assert } from '@metamask/utils';

export const onExternalData: OnExternalDataHandler = ({ id, type, data, source }) => {
  assert(type === 'websocket'); // `data` is inferred as `WebSocketData`.
  assert(data.type === 'text'); // `message` is inferred as `string`.

  // Now the Snap can do whatever is needed with the message.
  const json = JSON.parse(data.message);
};
```

Snap that wants to use external data sources MUST have `onExternalData` function export.

Exported function SHOULD accept an object parameter that MAY have `id`, `type`, `data` and `source` properties.

This export SHOULD be called every time the WebSocket client or Blockchain event listener receives some data or event.

The parameters represent the following:
- `id`: Unique ID of an event generated internally on the controller side. This can be used for tracking each event
  in case of storage needs or debugging. The `id` MUST be unique string.
- `data`: SHOULD be the raw message that the WebSocket client received. Depending on the `type`, this SHOULD be
  either a `string` or an `ArrayBuffer`.
- `type`: The type of the message that was sent. This SHOULD be either `text` or `binary`.
- `source`: The URL that the message was sent from. Snaps can use this to differentiate between different endpoints.
  This SHOULD be the exact same URL as specified in manifest.

The RECOMMENDED specification of types of `OnExternalDataHandler` and its parameters:

```typescript
type WebSocketMessage = {
  type: 'text';
  message: string;
} | {
  type: 'binary';
  message: ArrayBuffer;
};

type WebSocketData = {
  type: 'websocket';
  data: WebSocketMessage;
};

type ExternalData = WebSocketData;

type OnExternalDataHandlerArgs = ExternalData & {
  source: string;
};

type OnExternalDataHandler = (args: OnExternalDataHandlerArgs) => Promise<void>;
```

The specification MAY be extended or changed depending on a type of data or event sources and their implementation
needs.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
