---
sip: 34
title: History Item Insights
status: Draft
author: Kylan Hurt (@smilingkylan, kylan.hurt@gmail.com)
created: 2025-10-26
---

## Abstract

The purpose of this SIP is to propose the addition of an lifecycle hook, similar to the `onTransaction` and `onSignature` hooks that triggers when the user clicks on a history item (typically a transaction), passing with it parameters related to the transaction. I am giving this hook the name `onHistoryItem`.

## Motivation

Some web functionality works best when triggered after a financial transaction has occurred. In Web2 some examples may be satisfaction surveys after an online order, an email encouraging users to sign up for a newsletter, or consider purchasing another product related to the one they just bought.

While Web3 may not support communication services like email or text message natively, we can include information and call-to-actions at the point where the user is within the context of the product they just bought: when viewing the completed (or failed) transaction itself. The equivalent in MetaMask is Activity (history) tab of the home screen.

If a user wants to learn more about a past transaction or the smart contract / dapp they interacted with then we can present those sorts of insights to them at the point when they are viewing a previous transaction.

## Specification

One of the perks of this proposal is that we can more or less mimic the `onTransaction` and `onSignature` handlers. The main two differences will be the following:

1. Different entry-point (I will leave this part to you)
2. The parameters passed to the `onActivityItem` function should also include information about confirmations for the activity item / transaction

```
import type { OnActivityItemHandler } from "@metamask/snaps-sdk";
import { Box, Heading, Text } from "@metamask/snaps-sdk/jsx";

export const onActivityItem: OnActivityItemHandler = async ({
  // should this be `activityItem` instead or is `Activity` only ever transactions?
  // `transaction` param should also include details about tx / block confirmations
  transaction,
  chainId,
  transactionOrigin,
}) => {
  const insights = /* Get insights */;
  return {
    content: (
      <Box>
        <Heading>My Activity Item Insights</Heading>
        <Text>Here are the insights:</Text>
        {insights.map((insight) => (
          <Text>{insight.value}</Text>
        ))}
      </Box>
    ),
  };
};
```

For inspiration: https://github.com/MetaMask/snaps/pull/3534 (I called the hook `onTransactionDetail` in this **obsolete** PR)

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP introduces a new permission named `endowment:activity-item-insight`. This permission grants a Snap the ability to read details about an activity item (tx) and optionally the origin from which that transaction oriented. The MM Snaps team is welcome to include or exclude any properties they see fit to best enable Snaps developers.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:activity-item-insight": {
      "allowActivityItemOrigin": true
    }
  }
}
```

### Security Considerations

The security concerns are very similar to the `onTransaction` handler except that it will typically be a past transaction rather one that is about to be signed.

### User Experience Considerations

None

## Backwards Compatibility

This SIP introduces a new method and does not modify any existing functionality. Therefore, there are no backwards compatibility concerns.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE). 