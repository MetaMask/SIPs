---
sip: 10
title: Transaction Insights V2 - Transaction Warnings
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/101
author: Hassan Malik (@hmalik88)
created: 2023-07-16
---

## Abstract

This SIP proposes a way for snaps to provide extra friction for executing potentially dangerous transactions within MetaMask.

## Motivation

One of the biggest issues with wallet users is a loss of funds through executing some sketchy or seemingly innocuous transaction. With the benefit of the transaction insights API, a snap can already run analysis on an unsigned transaction paylod. Why not allow for the snap to provide extra friction to the user if it determines that a transaction is malicious? Users often click through things without reading, by allowing for a warning we can add friction at points that we really think a user should have a second glance.

This warning could be injected at any point where there are insights provided.

## Specification

> Formal specifications are written in Typescript. Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs).

Please see SIP-3 for more information on the original transaction insights API.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Implementation

Any snap that wishes to provide transaction insight features **MUST** implement the following API:

```typescript
import { OnTransactionHandler } from "@metamask/snap-types";

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
}) => {
  const insights = /* Get insights */;
  const willFail = () => /* Return boolean */;
  return willFail(insights) ? { insights, warning: 'Some warning message' } : { insights };
};
```

The interface for the return value of an `onTransaction` export is:

```typescript
interface OnTransactionReturn {
  insights: Record<string, Json>;
  warning?: string;
}
```

### MetaMask Integration

The `insights` object returned by the snap will be displayed alongside the confirmation for the `transaction` that `onTransaction` was called with.
Keys and values will be displayed in the order received, with each key rendered as a title and each value rendered as follows:

- If the value is an array or an object, it will be rendered as text after being converted to a string.
- If the value is neither an array nor an object, it will be rendered directly as text.

The `warning` key's value will be displayed in a modal alongside any warnings from other transaction insight snaps. The modal will require a checkbox to be checked before the user can continue with the transaction.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
