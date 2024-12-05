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

### Snap Manifest

This SIP introduces a new permission named `endowment:assets`.
This permission grants a Snap the ability to provide asset information to the client.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:assets": {
        "chains": [
            "bip122:000000000019d6689c085ae165831e93"
        ]
    }
  }
}
```

`chains` - A non-empty array of CAIP-2 chain IDs that the snap supports. This field is useful for a client in order to avoid unnecessary overhead.

### Snap Implementation

Two methods are defined in the Snap Assets API:

Any Snap that wishes to provide asset information **MUST** implement the following API:

#### Get Asset Description

```typescript
import { OnAssetDescriptionHandler } from "@metamask/snaps-sdk";

export const onAssetDescription: OnAssetDescriptionHandler = async ({
  assets
}) => {
  const description = /* Get description */;
  return { description };
};
```

The type for an `onAssetDescription` handler function’s arguments is:

```typescript
interface OnAssetDescriptionArgs {
    assets: Caip19AssetType[];
}
```
The type for an `onAssetDescription` handler function’s return value is:

```typescript
// {
//     name: 'Ether',
//     ticker: 'ETH',
//     isNative: true,
//     iconBase64: 'data:image/png;base64,...',
//     units: [
//         {
//             name: 'Ether',
//             ticker: 'ETH',
//             decimals: 18
//         },
//         {
//             name: 'Gwei',
//             ticker: 'Gwei',
//             decimals: 9
//         },
//         {
//             name: 'wei',
//             ticker: 'wei',
//             decimals: 0
//         }
//    ]
// }

// Represents a asset unit.
type AssetUnit = {
    // Human-friendly name of the asset unit.
    name: string;

    // Ticker of the asset unit.
    ticker: string;

    // Number of decimals of the asset unit.
    decimals: number;
};

// Asset description.
type AssetDescription = {
    // The CAIP-19 ID of the asset.
    id: Caip19AssetType;

    // Human-friendly name of the asset.
    name: string;

    // Ticker of the asset.
    ticker: string;

    // Whether the asset is native to the chain.
    isNative: boolean;

    // Base64 representation of the asset icon.
    iconBase64: string;

    // List of asset units.
    units: AssetUnit[];
};


type OnAssetDescriptionReturn = {
    description: Record<Caip19AssetType, AssetDescription>;
};
```

#### Get Asset Conversion Rate

```typescript
import { OnAssetConversionHandler } from "@metamask/snaps-sdk";

export const onAssetConversion: OnAssetConversionHandler = async ({
  from,
  to
}) => {
  const conversionRate = /* Get conversion rate */;
  return { conversionRate };
};
```
The type for an `onAssetDescription` handler function’s arguments is:

```typescript
interface OnAssetConversionArgs {
    from: Caip19AssetType[];
    to: Caip19AssetType;
}
```
The type for an `onAssetDescription` handler function’s return value is:

```typescript
type AssetConversionRate = {
    // The rate of conversion from the source asset to the target asset. It
    // means that 1 unit of the `from` asset should be converted to this amount
    // of the `to` asset.
    rate: string;

    // The UNIX timestamp of when the conversion rate was last updated.
    conversionTime: number;

    // The UNIX timestamp of when the conversion rate will expire.
    expirationTime: number;
};


// {
//     rate: '3906.38',
//     conversionTime: 1733389786,
//     expirationTime: 1733389816,
// }

type OnAssetConversionReturn = {
    conversionRate: Record<Caip19AssetType, AssetConversionRate>;
};
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