---
sip: 20
title: External data entry point
status: Draft
author: David Drazic (@david0xd)
created: 2023-12-15
---

- `snap_openConnection`
- `snap_closeConnection`
- `snap_sendMessage`

```ts
export type WebSocketDataEvent = {
  type: "data";
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

```ts
export const onWebSocketEvent = ({ event }) => {};
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
