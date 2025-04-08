---
sip: 32
title: Event tracking method for pre-installed Snaps
status: Draft
author: Daniel Rocha (@danroc)
created: 2025-03-20
---

## Abstract

This Snap Improvement Proposal (SIP) introduces a new method,
`snap_trackEvent`, allowing pre-installed Snaps to submit tracking events
through the client. The client will determine how to handle these events.

This feature enables Snaps to utilize the existing client infrastructure for
event tracking while maintaining user privacy.

## Motivation

Currently, there is no standardized way for pre-installed Snaps to submit
analytics or tracking events. This proposal aims to:

- Enable pre-installed Snaps to leverage the client's event tracking
  infrastructure.

- Ensure that event handling is controlled at the client level and conforms to
  security and privacy controls enforced by the client.

## Specification

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written
in uppercase in this document are to be interpreted as described in [RFC
2119](https://www.ietf.org/rfc/rfc2119.txt)

### `snap_trackEvent`

The `snap_trackEvent` method allows pre-installed Snaps to submit structured
tracking events to the client. It is the client’s responsibility to process
these events accordingly.

The `snap_trackEvent` method is endowed on any Snap that the client considers
pre-installed.

#### Parameters

- `event` - Event object to be tracked.
  - `name: string` - The name of the event to track.

  - `properties: Record<string, Json>` - (**Optional**) Custom values to track.
    The client MUST enforce that all keys in this object are in the
    `snake_case` format.

#### Returns

Resolves to `null` when the event is successfully handled by the client.

#### Example

```typescript
await snap.request({
  method: 'snap_trackEvent',
  params: {
    event: {
      name: 'Account Added',
      properties: {
        message: 'Snap account added',
      },
    },
  },
});
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
