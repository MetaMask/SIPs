---
sip: 29
title: Snap Assets API
status: Draft
author: Daniel Rocha (@danroc), Guillaume Roux (@GuillaumeRx)
created: 2024-12-05
---

## Abstract

This SIP aims to define a new API that can be exposed by Snaps to allow clients
to retrieve asset information in a chain-agnostic way.

## Motivation

To enable clients to be chain-agnostic, the logic for obtaining asset
information should be abstracted away from the client. Additionally, this SIP
defines the types that represent the asset information required by clients.

## Specification

> Indented sections like this are considered non-normative.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written
in uppercase in this document are to be interpreted as described in [RFC
2119](https://www.ietf.org/rfc/rfc2119.txt)

### Definitions

1. In this document, all definitions are written in TypeScript.

2. Any time an asset needs to be identified, it MUST use the [CAIP-19][caip-19]
representation.

### Snap Assets API

Two methods are defined in the Snap Assets API:

#### Get Token Description

```typescript
// Represents a token unit.
type TokenUnit = {
    // Human-friendly name of the token unit.
    name: string;

    // Ticker of the token unit.
    ticker: string;

    // Number of decimals of the token unit.
    decimals: number;
};

// Token description.
type TokenDescription = {
    // Human-friendly name of the token.
    name: string;

    // Ticker of the token.
    ticker: string;

    // Whether the token is native to the chain.
    isNative: boolean;

    // Base64 representation of the token icon.
    iconBase64: string;

    // List of token units.
    units: TokenUnit[];
};

// Returns the description of a non-fungible token. This description can then
// be used by the client to display relevant information about the token.
//
// @example
// ```typescript
// const tokenDescription = await getTokenDescription('eip155:1/slip44:60');
//
// // Returns:
// // {
// //     name: 'Ether',
// //     ticker: 'ETH',
// //     isNative: true,
// //     iconBase64: 'data:image/png;base64,...',
// //     units: [
// //         {
// //             name: 'Ether',
// //             ticker: 'ETH',
// //             decimals: 18
// //         },
// //         {
// //             name: 'Gwei',
// //             ticker: 'Gwei',
// //             decimals: 9
// //         },
// //         {
// //             name: 'wei',
// //             ticker: 'wei',
// //             decimals: 0
// //         }
// //     ]
// // }
// ```
function getTokenDescription(token: Caip19AssetType): TokenDescription;
```

#### Get Token Conversion Rate

```typescript
type TokenConversionRate = {
    // The rate of conversion from the source token to the target token. It
    // means that 1 unit of the `from` token should be converted to this amount
    // of the `to` token.
    rate: string;

    // The UNIX timestamp of when the conversion rate was last updated.
    conversionTime: number;

    // The UNIX timestamp of when the conversion rate will expire.
    expirationTime: number;
};

// Returns the conversion rate between two assets (tokens or fiat).
//
// @example
// ```typescript
// const conversionRate = await getTokenConversionRate(
//   'eip155:1/slip44:60',
//   'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f'
// );
//
// // Returns:
// // {
// //     rate: '3906.38',
// //     conversionTime: 1733389786,
// //     expirationTime: 1733389816,
// // }
// ```
function getTokenConversionRate(
    from: Caip19AssetType,
    to: Caip19AssetType
): TokenConversionRate;
```

### Fiat currency representation

We SHOULD use CAIP-19 to represent fiat currencies as well. This approach
provides a consistent way to represent all assets, making the API more
predictable. The proposed format is:

```
asset_type:        chain_id + "/" + asset_namespace + ":" + asset_reference
chain_id:          namespace + ":" + reference
namespace:         "fiat"
reference:         country_code
asset_namespace:   "currency"
asset_reference:   currency_code
```

The country code is a two-letter lowercase code, as defined by ISO 3166-1
alpha-2, representing the emitter country, with the exception of the European
Union, which is represented by "eu".

The currency code is a three-letter uppercase code as defined by ISO 4217.

Examples:

```
# Euro
fiat:eu/currency:eur

# United States Dollar
fiat:us/currency:usd

# Brazilian Real
fiat:br/currency:brl

# Japanese Yen
fiat:jp/currency:jpy
```

## Backwards compatibility

Any SIPs that break backwards compatibility MUST include a section describing
those incompatibilities and their severity. The SIP SHOULD describe how the
author plans on proposes to deal with such these incompatibilities.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).

[caip-19]: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md
