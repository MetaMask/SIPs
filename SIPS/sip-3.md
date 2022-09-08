---
sip: 3
title: Transaction Insights
status: Review
discussions-to: https://github.com/MetaMask/SIPs/discussions/31
author: Hassan Malik (@hmalik88), Frederik Bolding (@frederikbolding)
created: 2022-08-23
---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Abstract](#abstract)
- [Motivation](#motivation)
- [Specification](#specification)
  - [Language](#language)
  - [Definitions](#definitions)
  - [Common types](#common-types)
  - [Snap Developer](#snap-developer)
    - [Manifest](#manifest)
    - [Snap](#snap)
- [History](#history)
- [Copyright](#copyright)

## Abstract

This SIP proposes a way for snaps to provide extra "insight" into the transactions that users are signing. These insights can then be displayed in the MetaMask confirmation UI, informing the user better before they sign.

Example use-cases for transaction insights are phishing detection, malicious contract detection and transaction simulation.

## Motivation

Deciding what information to show before a user is prompted to sign a transaction and furthermore deciding which information is critical is a difficult problem. It may even be user-dependant. Similarly to how SIP-2 allows snaps to expand the keyrings that MetaMask support, this SIP aims to expand the options the user is given in which information they see before signing a transaction.

The current MetaMask extension already has a "transaction insights" feature that does transaction simulation and shows the result to the user. This SIP aims to expand on this feature, allowing the community to build snaps that provide **any form of "insight"** into a transaction. This insight will be shown in the MetaMask UI alongside any official insight provided by MetaMask itself.

## Specification

> Formal specifications are written in Typescript. Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs)

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Definitions

> This section is non-normative

- `ChainId` - a [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) string. It identifies a specific chain in all of possible blockchains.
  - `ChainId` consists of a `Namespace` and a `Reference`
    - `Namespace` - A class of similar blockchains. For example EVM-based blockchains.
    - `Reference` - A way to identify a concrete chain inside a `Namespace`. For example Ethereum Mainnet or Polygon.

### Common types

The below common types are used throughout the specification

```typescript
type ChainId = string;
```

- `ChainId` strings MUST be [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) Chain Id.

  The Regular Expression used to validate Chain IDs by the snap SHOULD be:

```typescript
  const chainIdValidation =
    /^(?<namespace>[-a-z0-9]{3,8}):(?<reference>[-a-zA-Z0-9]{1,32})$/;
```

### Snap Developer

#### Manifest

This SIP proposes to add a new permission named `endowment:transaction-insight`. The permission would allow a snap access to an unsigned transaction’s payload.

An example usage of the permission inside `snap.manifest.json` is as follows:

```json
{
  "initialPermissions": {
    "endowment:transaction-insight": {}
  }
}
```

#### Snap

Any snap that wishes to expose transaction insight features must implement the following API:

```typescript
import { OnTransactionHandler } from "@metamask/snap-types";

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
}) => {
  // do something
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

**Transaction** - The transaction object is specifically not defined in this SIP because the transaction object can look different across various chains and it is not our intention to define an interface for every chain. Instead, the onus is on the Snap developer to be cognizant of the shape of the transaction object. However, that being said, the _default_ transaction object in the MetaMask extension is of the following interface:

_[NON EIP-1559]_

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

_[EIP-1559]_

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

**ChainId** - This is a CAIP-2 `ChainId` string, the snap is expected to parse and utilize this string as needed.

The return type for an `onTransaction` export should be as follows:

```typescript
interface OnTransactionReturn {
  insights: Record<string, Json>;
}
```

### MetaMask Extension Integration

A transaction insight snap (a snap with the `endowment:transaction-insight` permission) will be displayed in an extra tab in MetaMask confirmation screens. Currently, transaction insights will be provided for contract interaction type transactions. The `insights` object returned from the snap will be displayed in the confirmation screen UI as titles and subtext. The key being the title and the subtext being a stringified version of the value.

**Note:** In the future, the intention is to extend the `OnTransactionReturn` interface with additional properties that can interact with the extension in various ways.

## History

The transaction insight feature has been inspired by the need to improve user confidence in everyday web3 interactions. Allowing for various transaction insights inside of MetaMask will increase confidence, improve UX and ultimately provide a safer and more informed experience for our users.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
