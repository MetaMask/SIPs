---
sip: 20
title: WebSockets
status: Draft
author: David Drazic (@david0xd), Frederik Bolding (@frederikbolding), Guillaume Roux (@guillaumerx) 
created: 2023-12-15
updated: 2024-06-05
---

## Abstract
This SIP proposes to expose a new communication protocol to `endowment:network-access`, that enables Snaps to communicate with external services via WebSockets. This will allow Snaps to receive real-time data updates from external sources, such as price feeds or event notifications.

## Motivation
Currently, Snaps can only communicate with external services via HTTP requests. This limits their ability to receive real-time data updates, which is essential for many use cases, such as price feeds or event notifications. By exposing a WebSocket protocol, Snaps can establish persistent connections with external services and receive real-time updates.

## Specification

> Formal specifications are written in TypeScript. 

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Top-level architecture

This architecture defers WebSocket management to the client, allowing Snaps to open, close, and send messages over WebSocket. The client will handle the underlying WebSocket connections and notify the Snap of any events that occur on those connections.

The client has multiple responsibilities in this architecture:
- All WebSocket connections opened by Snaps MUST be monitored by the client. Each connection is identified by a unique identifier, which is returned to the Snap when the connection is opened.

- Any incoming message from WebSocket connections MUST be handled by the client and forwarded to the appropriate Snap through `onWebSocketEvent`. 

- When the Snap requests to open a WebSocket connection via `snap_openWebSocket`, the client MUST ensure that the connection is established and return a unique identifier for that connection.

- Any open connection MUST be kept alive by the client until the Snap explicitly closes it or the connection is lost, even when the Snap is terminated.

- When the Snap requests to close a WebSocket connection via `snap_closeWebSocket`, the client MUST close the connection and remove it from its list of open connections.

- Any errors that occur when the WebSocket connection is open (e.g., connection failure, message send failure) MUST be handled by the client and reported to the Snap via `onWebSocketEvent`.


### Snap Manifest

This SIP doesn't introduce any new permissions, but rather extends `endowment:network-access` with new capabilities.

### RPC Methods

#### `snap_openWebSocket`

This method allows a Snap to open a WebSocket connection to an external service. The method takes a URL as a parameter and returns a unique identifier for the connection.

```typescript

type OpenWebSocketParams = {
  url: string;
};
```
The RPC method takes one parameter:

- `url` - The URL of the WebSocket service to connect to. 
  - The URL MUST be a valid WebSocket URL, starting with `wss://`. URLs starting with `ws://` are not allowed.
  - Only one WebSocket connection can be opened per URL at a time. If a Snap tries to open a new connection to the same URL while an existing connection is still open, the client MUST throw an error.

An example of usage is given below.

```typescript
snap.request({
  method: "snap_openWebSocket",
  params: {
    url: "wss://example.com/websocket",
  },
});

```

#### `snap_closeWebSocket`
This method allows a Snap to close an existing WebSocket connection. The method takes the unique identifier of the connection as a parameter.

```typescript
type CloseWebSocketParams = {
  id: string;
};
```
The RPC method takes one parameter:
- `id` - The unique identifier of the WebSocket connection to close. This identifier is returned by the `snap_openWebSocket` method.

An example of usage is given below.

```typescript
snap.request({
  method: "snap_closeWebSocket",
  params: {
    id: "unique-connection-id",
  },
});
```
#### `snap_sendMessage`
This method allows a Snap to send a message over an existing WebSocket connection. The method takes the unique identifier of the connection and the message to send as parameters.

```typescript
type SendWebSocketMessageParams = {
  id: string;
  message: string | number[];
};
```

The RPC method takes two parameters:
- `id` - The unique identifier of the WebSocket connection to send the message over. This identifier is returned by the `snap_openWebSocket` method.
- `message` - The message to send over the WebSocket connection. It can be either a string or a `Uint8Array`.

An example of usage is given below.

```typescript
snap.request({
  method: "snap_sendMessage",
  params: {
    id: "unique-connection-id",
    message: "Hello, WebSocket!",
  },
});
```
#### `snap_getWebSockets`
This method allows a Snap to retrieve a list of all currently open WebSocket connections. It returns an array of objects, each containing the unique identifier and URL of the connection.

- `id` - The unique identifier of the WebSocket connection.
- `origin` - The origin of the WebSocket connection.

```typescript
type WebSocketConnection = {
  id: string;
  origin: string;
};

type GetWebSocketsResult = WebSocketConnection[];
```

An example of usage is given below.

```typescript
snap.request({
  method: "snap_getWebSockets",
})
```


### Handling WebSocket Events

Snaps can handle WebSocket events by implementing the `onWebSocketEvent` handler. This handler will be called whenever a WebSocket event occurs, such as receiving a message, opening a connection, closing a connection, or encountering an error.

```typescript
import { OnWebSocketEventHandler } from "@metamask/snap-sdk";

export const onWebSocketEvent: OnWebSocketEventHandler = async ({ event }) => {
  switch (event.type) {
    case "message":
      // Handle incoming message
      console.log(`Message received from ${event.origin}:`, event.data);
      break;
    case "open":
      // Handle connection opened
      console.log(`WebSocket connection opened with ID ${event.id} from ${event.origin}`);
      break;
    case "close":
      // Handle connection closed
      console.log(`WebSocket connection closed with ID ${event.id} from ${event.origin}`);
      break;
    case "error":
      // Handle error
      console.error(`WebSocket error occurred with ID ${event.id} from ${event.origin}`);
      break;
  }
};
```
the type for an `onWebSocketEvent` handler function's arguments is:

```typescript
export type WebSocketMessageEvent = {
  type: "message";
  id: string;
  origin: string;
  dataType: "text" | "binary";
  data: string | Uint8Array;
};

export type WebSocketOpenEvent = {
  type: "open";
  id: string;
  origin: string;
};

export type WebSocketCloseEvent = {
  type: "close";
  id: string;
  origin: string;
};

export type WebSocketErrorEvent = {
  type: "error";
  id: string;
  origin: string;
};

export type WebSocketEvent =
  | WebSocketDataEvent
  | WebSocketOpenEvent
  | WebSocketCloseEvent
  | WebSocketErrorEvent;
```

```typescript
type OnWebSocketEventArgs = {
  event: WebSocketEvent;
};
```
`type` - The type of the WebSocket event, which can be one of the following:
  - `message` - Indicates that a message has been received.
  - `open` - Indicates that a WebSocket connection has been opened.
  - `close` - Indicates that a WebSocket connection has been closed.
  - `error` - Indicates that an error has occurred with the WebSocket connection.

`id` - The unique identifier of the WebSocket connection associated with the event.

`origin` - The origin of the WebSocket event.

`dataType` - The type of data received in the event, which can be either `text` or `binary`. This property is only present for `message` events.

`data` - The data received in the event. For `message` events, this can be either a string (for text messages) or a `Uint8Array` (for binary messages). For other event types, this property is not present.

This handler does not return any value. It is used to handle WebSocket events asynchronously:

```typescript
type OnWebSocketEventResponse = void;
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
