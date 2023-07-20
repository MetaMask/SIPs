---
sip: 11
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

Please see [SIP-3](https://github.com/MetaMask/SIPs/blob/main/SIPS/sip-3.md) for more information on the original transaction insights API.

Please see the [@metamask/snaps-ui](https://github.com/MetaMask/snaps/blob/main/packages/snaps-ui/src/nodes.ts) package for more information on the `Component` type returned in the `OnTransactionResponse`.

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
  const constructComponent = (insights) => /* Return Component */;
  const content = constructComponent(insights);
  const willFail = () => /* Return boolean */;
  return willFail(insights) ? { content, severity: 'critical' } : { content };
};
```

The interface for the return value of an `onTransaction` export is:

```typescript
enum SeverityLevel {
  Critical = 'critical',
}

interface OnTransactionResponse {
  content: Component | null;
  severity?: SeverityLevel;
}
```

**Note:** `severity` is an optional field and the omission of such means that there is no escalation of the content being returned.

### MetaMask Integration

The `severity` key is added to the return object to indicate the severity level of the content being returned to the extension. This will help trigger certain UI in the extension. Currently, a warning modal will be triggered for content with a severity level of `critical`. The modal will require a checkbox to be checked before the user can continue with the transaction.

In the future, the `SeverityLevel` enum can be expanded to include other levels that can be also be used to influence the UI in the extension.

Transaction insight snaps were previously triggered on view of their respective tabs, but with the addition of the `severity` key, execution would become unprompted in order to determine if a modal needs to be displayed as you reach the confirmation screen.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
