---
sip: 20
title: External data entry point
status: Draft
author: David Drazic (@david0xd)
created: 2023-12-15
---

## Abstract

This SIP proposes a new permission that enables Snaps to receive data from external sources.

In the initial version, this SIP proposes support for WebSockets, but it can be extended to support other data sources like blockchain events in the future.
The Snap can specify the external data source in the Snap manifest. The client then connects to the external data source and sends the data to the Snap.
The Snap can then do whatever it wants with the data. This initial version only supports one-way communication from the external source to the Snap. The Snap can't send any data back to the external source.

## Motivation

Snaps are currently limited in their ability to receive data from external sources: Either they have to rely on user actions or cron jobs to fetch data, so they can't react to events in real time. Snaps also cannot use WebSocket connections to receive data from external sources, and are limited to HTTP requests.

## Specification

> Formal specifications are written in Typescript.

### Language

The key words "MUST", "MUST NOT", "SHOULD", "RECOMMENDED" and "MAY" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

### Snap Manifest

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
 */
type ExternalData = ExternalDataConnection[];
```

#### Example

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

Each caveat object MUST have `type` property that SHOULD be `websocket`.
The caveat MUST have `url` and `dataType` properties.
The `url` MUST be string.
The `dataType` MUST be string that MUST be `"binary"` or `"text"`.

- `type` property represents the type of data source.
- `url` is the WebSocket URL.
- `dataType` is type of data that WebSocket returns.

The caveats MUST NOT have duplicate objects with the same `url` properties.

The `url` MUST start with `wss://` which is a protocol indicator for secure WebSocket connection.

### Snap implementation

This SIP introduces a new `onExternalData` function export that MAY be implemented by the Snap. The function is called every time the WebSocket client receives some data. The function SHOULD accept an object parameter that MUST have `data`, `type` and `source` properties.
The parameters represent the following:
- `data`: An object that represents the data that was received. Depending on the `data.type`, this SHOULD contain a `message` property, which SHOULD be either a `string` or an `ArrayBuffer`.
- `type`: The type of the external data source. For this SIP, this SHOULD always be `websocket`.
- `source`: The URL that the message was sent from. Snaps can use this to differentiate between different endpoints. This SHOULD be the exact same URL as specified in manifest.

The specification of types of `onExternalData` and its parameters:

```typescript
/**
 * A text message received from a WebSocket.
 *
 * @property type - The type of the message.
 * @property message - The message as a string.
 */
type WebSocketTextMessage = {
  type: 'text';
  message: string;
};
/**
 * A binary message received from a WebSocket.
 *
 * @property type - The type of the message.
 * @property message - The message as an ArrayBuffer.
 */
type WebSocketBinaryMessage = {
  type: 'binary';
  message: ArrayBuffer;
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
  data: WebSocketTextMessage | WebSocketBinaryMessage;
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

export const onExternalData: OnExternalDataHandler = ({ id, type, data, source }) => {
  assert(type === 'websocket'); // `data` is inferred as `WebSocketData`.
  assert(data.type === 'text'); // `message` is inferred as `string`.

  // Now the Snap can do whatever is needed with the message.
  const json = JSON.parse(data.message);
};
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
