SIP-3: Transaction Insights


---
sip: 3
title: Transaction Insights
status: Review
discussions-to: https://github.com/MetaMask/SSIPs/discussions
author: Hassan Malik (@hmalik88)
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

This SIP proposes a way for snaps to provide transaction insights that can then be displayed in the MetaMask confirmation UI.

Example use-cases for transaction insights can be phishing detection, malicious address detection, transaction simulation, arbitrage trading.

## Motivation

One of the main use cases for transaction insights is transaction simulation. In the current state of the MetaMask wallet, we do not provide any sort of insight as to whether or not a transaction will succeed based on the web of contract/address interaction that can happen. Transaction insight snaps would provide the ability to calculate some sort of insights and return them to the wallet..

## Specification

> Formal specifications are written in Typescript and [JSON schema version 2020-12](https://json-schema.org/draft/2020-12/json-schema-core.html). Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs)

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
- `AccountId` - a [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md) string. It identifies a specific account on a specific chain.

### Common types

The below common types are used throughout the specification

```typescript
type ChainId = string;

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
  
The transaction insight snap implementation must implement the following API:

```typescript
import { OnTransactionHandler } from '@metamask/snap-types';

export const onTransaction: OnTransactionHandler = async ({ transaction, chainId }) => {
    // do something
    return { insights }
}
```

The interface for an `onTransaction` handler function’s arguments is:

```typescript
interface OnTransactionArgs  {
    transaction: Record<string, unknown>;
    chainId: string;
}
```

**Transaction** - The transaction object is specifically not defined in this SIP because the transaction object can look different across various chains and it is not our intention to define an interface for every chain. Instead, the onus is on the Snap developer to be cognizant of the shape of the transaction object. However, that being said, the transaction object out of the MetaMask extension is of the following interface:

[NON EIP-1559]

```typescript
interface TransactionObject {
    from: string;
    to: string;
    nonce: string;
    value: string;
    data: string;
    gas: string;
    gasPrice: string;
    Type: string;
    estimateSuggested: string;
    estimateUsed: string;
}
```

[EIP-1559]

```typescript
interface TransactionObject {
	from: string;
	to: string;
	nonce: string;
	value: string;
	data: string;
	gas: string;
	maxFeePerrGas: string;
	maxPriorityFeePerGas: string;
	Type: string;
	estimateSuggested: string;
	estimateUsed: string;
}
```

**ChainId** - This is a CAIP-2 `ChainId` string, the snap is expected to parse and utilize this string as needed.
	

The return object for an `onTransaction` import should be as follows:

```typescript

interface OnTransactionReturn {
    insights: Record<string, unknown>;
}
```

## History

The transaction insight feature has been inspired by the need to improve user confidence in everyday web3 interactions. Allowing for various transaction insights inside of MetaMask will increase confidence, improve UX and ultimately drive the volume in transactions across our user base.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
