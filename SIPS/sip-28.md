---
sip: 28
title: Background Events
status: Draft
author: Olaf Tomalka (@ritave)
created: 2024-10-09
---

## Abstract

This SIP introduces a way to schedule non-recurring events in the future.

## Motivation

Scheduled recurring events are already supported in the Snaps platform via the Cronjobs feature. By introducing non-recurring events we will allow novel use-cases for Snap developers, such as allowing a snap that sets a reminder for ENS domain expiration date.

## Specification

> Indented sections like this are considered non-normative.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP doesn't introduce any new permissions, but rather extends `endowment:cronjob` with new capabilities through two new RPC methods.

### RPC Methods

#### `snap_scheduleBackgroundEvent`

This method allows a Snap to schedule a one-off callback to `onCronjob` handler in the future with a JSON-RPC request object as a parameter.

```typescript
type ScheduleBackgroundEventParams = {
  date: string;
  request: JsonRpcRequest;
};

type ScheduleBackgroundEventResult = string;
```

The RPC method takes two parameters:

- `date` - An [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date and time and optional timezone offset.
  - The time's precision SHALL be truncated on the extension side to minutes.
  - If no timezone is provided, the time SHALL be understood to be local-time.
    > Use ISO's `Z` identifier if you want to use UTC time.
- `request` - A JSON object that will provided as-is to `onCronjob` handler as parameter.

An example of usage is given below.

```typescript
snap.request({
  method: "snap_scheduleBackgroundEvent",
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

#### `snap_cancelBackgroundEvent`

This method allows to cancel an already scheduled background event using the unique ID returned from `snap_backgroundEventSchedule`

```typescript
type CancelBackgroundEventParams = { id: string };
```

This RPC method takes one argument:

- `id` - The id that was returned during schedule.

An example of usage is given below.

```typescript
snap.request({
  method: "snap_cancelBackgroundEvent",
  params: {
    id: myReturnedId,
  },
});
```

### `onCronjob` handler

This SIP doesn't modify `onCronjob` handler in any way.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
