---
sip: 34
title: Activity Item Insights
status: Draft
author: Kylan Hurt (smilingkylan.eth, kylan.hurt@gmail.com)
created: 2025-10-26
---

## Abstract

The purpose of this SIP is to propose the addition of a lifecycle hook, `onActivityItem`, similar to the `onTransaction` and `onSignature` hooks that triggers when the user clicks on a history item (typically a transaction), passing with it parameters related to the transaction.

## Motivation

Some web functionality works best when triggered after a financial transaction has occurred. In Web2 some examples may be satisfaction surveys after an online order, an email encouraging users to sign up for a newsletter, or consider purchasing another product related to the one they just bought.

While Web3 may not support communication services like email or text message natively, we can include information and call-to-actions at the point where the user is within the context of the product they just bought: when viewing the completed (or failed) transaction itself. The equivalent in MetaMask is Activity (history) tab of the home screen.

If a user wants to learn more about a past transaction or the smart contract / dapp they interacted with then we can present those sorts of insights to them at the point when they are viewing a previous transaction.

## Specification

> Formal specifications are written in Typescript. Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs).

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP introduces a new permission named `endowment:activity-insight`. This permission grants a Snap the ability to read details about an activity item (transaction) and optionally the origin from which that transaction originated.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:activity-insight": {}
  }
}
```

The permission includes an OPTIONAL caveat `allowActivityOrigin`.
The caveat grants a Snap read-only access to the URL of the dapp that initiated the transaction.
It can be specified as follows:

```json
{
  "initialPermissions": {
    "endowment:activity-insight": {
      "allowActivityOrigin": true
    }
  }
}
```

### Snap Implementation

The following is an example implementation of the API:

```typescript
import type { OnActivityItemHandler } from "@metamask/snaps-sdk";
import { Box, Heading, Text } from "@metamask/snaps-sdk/jsx";

export const onActivityItem: OnActivityItemHandler = async ({
  transaction,
  chainId,
  transactionOrigin,
  status,
  transactionHash,
  receipt,
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

The interface for an `onActivityItem` handler function's arguments is:

```typescript
interface OnActivityItemArgs {
  transaction: Transaction;
  chainId: CaipChainId;
  transactionOrigin?: string;
  status: ActivityItemStatus;
  transactionHash?: string;
  transactionType?: string;
  receipt?: ActivityItemReceipt;
  blockNumber?: string;
  blockTimestamp?: string;
  submittedTime?: number;
  error?: { message: string; rpc?: string };
}
```

`transaction` - The transaction parameters object. This is intentionally aligned with the `transaction` argument in `onTransaction` (see [SIP-3](sip-3.md)), using the same `Transaction` type from `@metamask/snaps-sdk`.

`chainId` - A [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) chain ID string (e.g. `"eip155:1"`).

`transactionOrigin` - The URL origin of the dapp that initiated the transaction. The existence of this property is dependent on the `allowActivityOrigin` caveat.

`status` - The status of the activity item at the time the user views it. See `ActivityItemStatus` below.

`transactionHash` - The on-chain transaction hash, if the transaction was submitted to the network.

`transactionType` - A string describing the kind of transaction (e.g. `"simpleSend"`, `"contractInteraction"`, `"swap"`, `"tokenMethodTransfer"`). The set of possible values may expand over time.

`receipt` - The transaction receipt, available once the transaction has been included in a block. See `ActivityItemReceipt` below.

`blockNumber` - The number of the block in which the transaction was included.

`blockTimestamp` - The timestamp of the block in which the transaction was included.

`submittedTime` - The Unix epoch timestamp (in milliseconds) at which the transaction was submitted to the network.

`error` - Error details if the transaction failed or was reverted on-chain.

The `ActivityItemStatus` type represents the possible states of an activity item as seen in the Activity tab:

```typescript
type ActivityItemStatus =
  | 'confirmed'  // Successfully mined and included in a block
  | 'failed'     // Reverted on-chain or errored during execution
  | 'submitted'  // Pending in the mempool
  | 'dropped'    // Replaced or dropped from the mempool
  | 'rejected';  // Rejected by the user before submission
```

The `ActivityItemReceipt` type contains on-chain execution details returned by the network after the transaction is mined:

```typescript
interface ActivityItemReceipt {
  blockHash?: string;
  blockNumber?: string;
  effectiveGasPrice?: string;
  gasUsed?: string;
  l1Fee?: string;
  logs?: { address?: string; data?: string; topics?: string }[];
  status?: string;           // "0x1" for success, "0x0" for revert
  transactionIndex?: string;
}
```

The interface for the return value of an `onActivityItem` export is:

```typescript
interface OnActivityItemResponse {
  content: Component | null;
  severity?: SeverityLevel;
}
```

### Security Considerations

The security concerns are very similar to the `onTransaction` handler (see [SIP-3](sip-3.md)), except that this hook fires on a completed or pending transaction rather than one that is about to be signed. Snap developers MUST NOT assume that the presence of a `receipt` or `transactionHash` implies the transaction was successful; the `status` field SHOULD be used as the authoritative indicator of outcome.

## Backwards Compatibility

This SIP introduces a new method and does not modify any existing functionality. Therefore, there are no backwards compatibility concerns.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
