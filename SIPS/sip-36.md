---
sip: 34
title: Snap Transaction Creation with `eth_sendTransaction`
status: Draft
author: Kylan Hurt (@smilingkylan, kylan.hurt@consensys.net, kylan.hurt@gmail.com)
created: 2025-10-27
---

## Abstract

The purpose of this SIP is to streamline the user experience by allowing Snaps to send transactions to the wallet provider directly with `eth_sendTransaction`, rather than requiring transactions to originate from outside of the Snap. Given that the user has already consented to the Snaps installation / functionality and each transaction is reviewed before the user approves it, this could be a great value-added feature.

## Motivation

While writing a Snap that shows `onTransaction` insights there may be times when the user or app developer would like the user to take action in the form of an additional transaction. For example a Snap could prompt a user:

- to adjust permissions before sending a transaction
- to remove a risky delegation when a Snap's Transaction Insight alerts the user
- to add more funds to "current" address before attempting a large transaction
- to convert their currency to the correct form (eg ETH vs wETH)
- to set ENS Reverse Record or Domain Link before broadcasting transaction
- to reduce size of trade if Snap analysis feels it will cause too much slippage

As a sidenote this feature can become even more potent if used with SIP-35's `onActivityItem` lifecycle event, making it easier for a user to submit follow-up transactions once the original transaction has been submitted. For example it could encourage a user to buy more crypto, to re-send the transcaction with a better fee value, or submit attestations about a recipient or smart contract.

## Specification

Snap developer will have to explicitly request the permission:

```json
{
  "initialPermissions": {
    "endowment:ethereum-provider": {},
    "endowment:eth_sendTransaction": {} // the exact permission key can be decided by the Snaps dev team
  }
}
```

```jsx
import { OnUserInputHandler } from '@metamask/snaps-sdk';
import type { OnTransactionHandler } from "@metamask/snaps-sdk";
import { Box, Heading, Text, Button } from "@metamask/snaps-sdk/jsx";

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
}) => {
  const recipientAddress = transaction.to;
  const reputationData = await fetchReputation(recipientAddress);

  const onUserInput: OnUserInputHandler = async (props: OnUserInputProps) => {
    const [type, direction] = props.event.name.split('_');

    if (!renderFn) return;
    await ethereum.request({
      method: "eth_sendTransaction", // <----------
      params: [
        {
          from: yourAddr,
          to: smartContractAddress,
          data: direction,
          value: someValue,
          // ...
        }
      ]
    });
  }

  return {
    content: (
      <Box>
        <Heading>Address Reputation</Heading>
        <Text>Trusted by: {reputationData.trustedCount} users</Text>
        <Text>Flagged by: {reputationData.flaggedCount} users</Text>
        
        <Button name="attest_trusted">
          Rate as Trusted ✅
        </Button>
        <Button name="attest_suspicious">
          Report as Suspicious ⚠️
        </Button>
      </Box>
    ),
  };
};
```


### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

Already mentioned above

### Security Considerations

Since `eth_sendTransaction` is a powerful command, some adjustments to UI / UX may be necessary to make sure the user understands that a new transaction is beign presented to them for signing. This can be especially tricky because smart contract function names and data are often presented as hex.

### User Experience Considerations

Mostly making sure the presentation of a new transaction to the user does not disrupt existing pending transaction queue. In fact this `eth_sendTransaction` functionality may be best presented at moments that are *not* part of the transaction signing + broadcasting process

## Backwards Compatibility

This SIP introduces a new method and does not modify any existing functionality. Therefore, there are no backwards compatibility concerns.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE). 