---
sip: 28
title: Background Events
status: Draft
author: Olaf Tomalka (@ritave)
created: 2024-10-09
---

## Abstract

A few terse sentences that are a technical summary of the proposal. Someone should be able to read this paragraph and understand the gist of this SIP.

## Motivation

The "why"

## Specification

> Indented sections like this are considered non-normative.

Formal specification of the proposed changes in the SIP. The specification must be complete enough that an implementation can be created from it.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP introduces a new permission `endowment:background-event`. This permissions grants a Snap the ability to schedule future events.

This permission takes no parameters and is specified in the `snap.manifest.json` as follows:

```json
{
  "initialPermissions": {
    "endowment:background-event": {}
  }
}
```

### RPC Methods

#### `snap_backgroundEventSchedule`

This method allows a Snap to schedule a callback to `onBackgroundEvent` handler in the future with a JSON-RPC request object as a parameter.

The RPC method takes two parameters:

- `date` - An [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date and time and optional timezone offset.
  - The time's precision SHALL be truncated on the extension side to minutes.
- `request` - A JSON object that will provided as-is to `onBackgroundEvent` handler as parameter.

```typescript
snap.request({
  method: "snap_backgroundEventSchedule",
  params: {
    date: "2024-10-09T09:59",
    request: {
      method: "foobar",
      params: {
        foo: "bar",
      },
    },
  },
});
```

The RPC method call returns a `string` that is a unique ID representing that specific background event, allowing it to be cancelled.

#### `snap_backgroundEventCancel`

This method allows to cancel an already scheduled background event using the unique ID returned from `snap_backgroundEventSchedule`

This RPC method takes one argument:

- `id` - The id that was returned during schedule.

```typescript
snap.request({
  method: "snap_backgroundEventCancel",
  params: {
    id: myReturnedId,
  },
});
```

### `onBackgroundEvent` handler

This SIP introduced a new handler called `onBackgroundEvent` which is called when a scheduled background event occurs.

It has one parameter - `request`, that is provided without change.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
