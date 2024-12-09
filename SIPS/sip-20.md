---
sip: 20
title: Advanced external communication and events
status: Draft
author: David Drazic (@david0xd)
created: 2023-12-15
---

## Abstract

This SIP proposes a new permission that enables Snaps to receive data from external sources.

In the initial version, this SIP proposes support for WebSockets, but it can be extended to support other data sources like blockchain events in the future.
The Snap can specify the external data source in the Snap manifest. The client then connects to the external data source and sends the data to the Snap.
The Snap can then do whatever it wants with the data, and can send data back to the external source if supported (e.g., a WebSocket connection).

## Motivation

Snaps are currently limited in their ability to communicate with external sources; they have to rely on user actions or cron jobs to fetch data, so they can't react to events in real time. Snaps also cannot use WebSocket connections for bidirectional communication, and are limited to HTTP requests.

## Specification

> Formal specifications are written in Typescript.

### Language

The key words "MUST", "MUST NOT", "SHOULD", "RECOMMENDED" and "MAY" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

### Snap manifest

This SIP introduces a new permission named `endowment:external-data`.

```typescript
/**
 * A WebSocket connection as specified in the Snap manifest.
 *
 * @property type - The type of connection. Currently, only WebSockets are
 * supported.
 * @property url - The URL to connect to. This must be a valid WebSocket URL,
 * starting with `wss://`. URLs starting with `ws://` are not allowed.
 * @property dataType - The type of data expected from the WebSocket. If this
 * field is omitted, text is assumed.
 */
type WebSocketConnection = {
  type: 'websocket';
  url: string;
  dataType?: 'text' | 'binary';
};

/**
 * An external data connection as specified in the Snap manifest.
 *
 * Currently, only {@link WebSocketConnection} is supported.
 */
type ExternalDataConnection = WebSocketConnection;

/**
 * External data connections as specified in the Snap manifest.
 *
 * This is the value of the `endowment:external-data` field in the Snap
 * manifest.
 *
 * @property maxRequestTime - The maximum request time for the `onExternalData`
 * entry point, as described in SIP-21.
 * @property connections - The external data connections.
 */
type ExternalData = {
    maxRequestTime?: number;
    connections: ExternalDataConnection[]
};
```

#### Example

The new field can be specified as follows in a `snap.manifest.json` file:

```json
{
  "initialPermissions": {
    "endowment:external-data": {
      "maxRequestTime": 50000,
      "connections": [
        {
          "type": "websocket",
          "url": "wss://example.com/binary/endpoint",
          "dataType": "binary"
        },
        {
          "type": "websocket",
          "url": "wss://example.com/text/endpoint",
          "dataType": "text"
        }
      ]
    }
  }
}
```

### Permission caveats

Each caveat object MUST have `type` property that SHOULD be `websocket`.
The caveat MUST have `url` and `dataType` properties.
The `url` MUST be string.
The `dataType` MUST be string that MUST be `"binary"` or `"text"`.

- `type` property represents the type of data source.
- `url` is the WebSocket URL.
- `dataType` is type of data that WebSocket returns.

The caveats MUST NOT have duplicate objects with the same `url` properties.

The `url` MUST start with `wss://` which is a protocol indicator for secure WebSocket connection.

### RPC Methods

This SIP introduces a new RPC method for sending data to the external connections (if supported).

#### snap_sendData

Snap can use `snap_sendData` RPC method to send data specified within request params.
The proposed RPC method `snap_sendData` SHOULD be a restricted RPC method. The RPC method SHOULD only be available to Snaps.
Snap MUST specify destination which is URL identifier of an external connection (e.g. websocket). Destination MUST be exact match of some of the URLs defined in manifest's permission caveats within `endowment:external-data`.

The `snap_sendData` JSON-RPC method takes an object as parameters, which has `data` and `destination` properties.

Example:
```json
{
  "method": "snap_sendData",
  "params": {
    "data": {
      "foo": "bar"
    },
    "destination": "wss://example.com/text/endpoint"
  }
}
```

The method returns a `boolean`, `true` in case of successful delivery of a message to the WebSocket. If delivery was unsuccessful, error is thrown.

### Snap implementation

This SIP introduces a new `onExternalData` function export that MAY be implemented by the Snap. The function is called every time the WebSocket client receives some data. The function SHOULD accept an object parameter that MUST have `data`, `type` and `source` properties.
The parameters represent the following:
- `data`: An object that represents the data that was received. Depending on the `data.type`, this SHOULD contain a `message` property, which SHOULD be either a `string` or an `ArrayBuffer`.
- `type`: The type of the external data source. For this SIP, this SHOULD always be `websocket`.
- `source`: The URL that the message was sent from. Snaps can use this to differentiate between different endpoints. This SHOULD be the exact same URL as specified in manifest.

The specification of types of `onExternalData` and its parameters:

```typescript
/**
 * WebSocket text message.
 *
 * @property type - The type of the message.
 * @property message - The message as a string.
 */
type WebSocketTextMessage = {
  type: 'text';
  message: string;
};

/**
 * WebSocket binary message.
 *
 * @property type - The type of the message.
 * @property message - The message as an ArrayBuffer.
 */
type WebSocketBinaryMessage = {
  type: 'binary';
  message: ArrayBuffer;
};

/**
 * Incoming Websocket message.
 *
 */
type WebSocketIncomingMessage = WebSocketTextMessage | WebSocketBinaryMessage;

/**
 * Outgoing Websocket message.
 *
 * @property destination - The destination web socket URL as a string.
 */
type WebSocketOutgoingMessage = WebSocketIncomingMessage & {
    destination: string;
};

/**
 * A message received from a WebSocket.
 *
 * @property type - The type of the message.
 * @property message - The message as a string or an ArrayBuffer, depending on
 * the type.
 */
type WebSocketData = {
  type: 'websocket';
  message: WebSocketIncomingMessage;
};

/**
 * The data received from an external source.
 *
 * @property type - The type of the external data source.
 * @property data - The data received from the external data source.
 */
type ExternalData = WebSocketData;

type OnExternalDataHandlerArgs = ExternalData & {
  source: string;
};

type OnExternalDataHandler = (args: OnExternalDataHandlerArgs) => Promise<void>;
```

#### Example

```typescript
import { OnExternalDataHandler } from '@metamask/snaps-types';
import { assert } from '@metamask/utils';

export const onExternalData: OnExternalDataHandler = async ({ type, data, source }) => {
  assert(type === 'websocket'); // `data` is inferred as `WebSocketData`.
  assert(data.type === 'text'); // `message` is inferred as `string`.
  // Now the Snap can do whatever is needed with the message.
  const json = JSON.parse(data.message);

  // Send message back
  await snap.request({
    method: 'snap_sendData',
    params: {
        type: 'text',
        message: 'Message received successfully',
        destination: 'wss://example.com/text/endpoint',
    },
  });
};
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
