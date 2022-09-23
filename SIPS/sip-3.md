---
sip: 3
title: Transaction Insights
status: Final
discussions-to: https://github.com/MetaMask/SIPs/discussions/31
author: Hassan Malik (@hmalik88), Frederik Bolding (@frederikbolding)
created: 2022-08-23
---

## Abstract

This SIP proposes a way for snaps to provide "insights" into transactions that users are signing. These insights can then be displayed in the MetaMask confirmation UI, helping the user to make informed decisions about signing transactions.

Example use cases for transaction insights are phishing detection, malicious contract detection and transaction simulation.

## Motivation

One of the most difficult problems blockchain wallets solve for their users is "signature comprehension", i.e. making cryptographic signature inputs intelligible to the user.
Blockchain transactions are signed before being submitted to a node, and constitute an important subset of this problem space.
A single wallet may not be able to provide all relevant information to any given user for any given transaction.
To alleviate this problem, this SIP aims to expand the kinds of information MetaMask provides to a user before signing a transaction.

The current MetaMask extension already has a "transaction insights" feature that decodes transactions and displays the result to the user.
To expand on this feature, this SIP allows the community to build snaps that provide arbitrary "insights" into transactions.
These insights can then be displayed in the MetaMask UI alongside any information provided by MetaMask itself.

## Specification

> Formal specifications are written in Typescript. Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs).

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Definitions

> This section is non-normative, and merely recapitulates some definitions from [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md).

- `ChainId` - a [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) string.
  It identifies a specific chain among all blockchains recognized by the CAIP standards.
  - `ChainId` consists of a `Namespace` and a `Reference`
    - `Namespace` - a class of similar blockchains. For example EVM-based blockchains.
    - `Reference` - a way to identify a concrete chain inside a `Namespace`. For example Ethereum Mainnet or one of its test networks.

### Snap Manifest

This SIP specifies a permission named `endowment:transaction-insight`.
The permission grants a snap read-only access to raw transaction payloads, before they are accepted for signing by the user.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:transaction-insight": {}
  }
}
```

### Snap Implementation

Any snap that wishes to provide transaction insight features **MUST** implement the following API:

```typescript
import { OnTransactionHandler } from "@metamask/snap-types";

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
}) => {
  const insights = /* Get insights */;
  return { insights };
};
```

The interface for an `onTransaction` handler function’s arguments is:

```typescript
interface OnTransactionArgs {
  transaction: Record<string, unknown>;
  chainId: string;
}
```

`transaction` - The transaction object is intentionally not defined in this SIP because different chains may specify different transaction formats.
It is beyond the scope of the SIP standards to define interfaces for every chain.
Instead, it is the Snap developer's responsibility to be cognizant of the shape of transaction objects for relevant chains.
Nevertheless, you can refer to [Appendix I](#appendix-i-ethereum-transaction-objects) for the interfaces of the Ethereum transaction objects available in MetaMask at the time of this SIP's creation.

`chainId` - This is a [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) `chainId` string.
The snap is expected to parse and utilize this string as needed.

The interface for the return value of an `onTransaction` export is:

```typescript
interface OnTransactionReturn {
  insights: Record<string, Json>;
}
```

### MetaMask Integration

The `insights` object returned by the snap will be displayed alongside the confirmation for the `transaction` that `onTransaction` was called with.
Keys and values will be displayed in the order received, with each key rendered as a title and each value rendered as follows:

- If the value is an array or an object, it will be rendered as text after being converted to a string.
- If the value is neither an array nor an object, it will be rendered directly as text.

## Appendix I: Ethereum Transaction Objects

The following transaction objects may appear for any `chainId` of `eip155:*` where `*` is some positive integer.
This includes all Ethereum or "EVM-compatible" chains.
As of the time of creation of this SIP, they are the only possible transaction objects for Ethereum chains.

### EIP-1559

```typescript
interface TransactionObject {
  from: string;
  to: string;
  nonce: string;
  value: string;
  data: string;
  gas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  type: string;
  estimateSuggested: string;
  estimateUsed: string;
}
```

### Legacy (non-EIP-1559)

```typescript
interface LegacyTransactionObject {
  from: string;
  to: string;
  nonce: string;
  value: string;
  data: string;
  gas: string;
  gasPrice: string;
  type: string;
  estimateSuggested: string;
  estimateUsed: string;
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
