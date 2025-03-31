---
sip: 29
title: Snap Assets API
status: Draft
author: Daniel Rocha (@danroc), Guillaume Roux (@GuillaumeRx)
created: 2024-12-05
updated: 2025-01-25
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
      "scopes": [
        "bip122:000000000019d6689c085ae165831e93"
      ]
    }
  }
}
```

`scopes` - A non-empty array of CAIP-2 chain IDs that the Snap supports. This field is useful for a client in order to avoid unnecessary overhead. Any asset returned by the Snap MUST be filtered out if it isn't part of the supported scopes.

### Snap Implementation

Two methods are defined in the Snap Assets API:

Any Snap that wishes to provide asset information MUST implement the following API:

#### Get Assets Metadata

`Caip19AssetType` - A string that represents an asset using the [CAIP-19][caip-19] standard.

```typescript
import { OnAssetsLookupHandler } from "@metamask/snaps-sdk";

export const onAssetsLookup: OnAssetsLookupHandler = async ({
  assets
}) => {
  const assetsMetadata = /* Get metadata for given `assets` */;
  return { assets: assetsMetadata };
};
```

The type for an `onAssetsLookup` handler function’s arguments is:

```typescript
interface OnAssetsLookupArguments {
  assets: Caip19AssetType[];
}
```

The type for an `onAssetsLookup` handler function’s return value is:

```typescript
type OnAssetsLookupResponse = {
  assets: Record<Caip19AssetType, AssetMetadata | null>;
};
```

#### Get Assets Conversion Rate

```typescript
import { OnAssetsConversionHandler } from "@metamask/snaps-sdk";

export const onAssetsConversion: OnAssetsConversionHandler = async ({
  conversions
}) => {
  const conversionRates = /* Get conversion rate for given `conversions` */;
  return { conversionRates };
};
```

The type for an `onAssetsConversion` handler function’s arguments is:

```typescript
type Conversion = {
  from: Caip19AssetType;
  to: Caip19AssetType;
};

type OnAssetsConversionArguments = {
  conversions: Conversion[];
  includeMarketData?: boolean;
};
```
- `includeMarketData` - A boolean that indicates whether the Snap should include market data in the response. If `true`, the Snap SHOULD include market data in the response if available.

The type for an `onAssetsConversion` handler function’s return value is:

```typescript
type AssetConversionRate = {
  // The rate of conversion from the source asset to the target asset represented as a decimal number in a string.
  // It means that 1 unit of the `from` asset should be converted to this amount
  // of the `to` asset.
  rate: string;

  // The UNIX timestamp of when the conversion rate was last updated.
  conversionTime: number;

  // The UNIX timestamp of when the conversion rate will expire.
  expirationTime?: number;

  // Market data for the asset pair.
  marketData?: {
    marketCap: string,
    totalVolume: string,
    circulatingSupply: string,
    allTimeHigh: string,
    allTimeLow: string,
    pricePercentChange: {
      // The interval key MUST follow the ISO 8601 duration format. The `all`
      // value is a special interval that represents all available data.
      [interval: string]: number;
    }
  };
};

type FromAsset = Conversion["from"];

type ToAsset = Conversion["to"];

type OnAssetsConversionResponse = {
  conversionRates: Record<From, Record<To, AssetConversionRate | null>>;
};
```

### Get Assets historical price

```typescript
import { OnAssetHistoricalPriceHandler } from "@metamask/snaps-sdk";

export const onAssetsHistoricalPrice: OnAssetsHistoricalPriceHandler = async ({
  from, to
}) => {
  const historicalPrice = /* Get historical price for given `from` and `to` */;
  return { historicalPrice };
};
```
The type for an `onAssetHistoricalPrice` handler function’s arguments is:

```typescript
interface OnAssetHistoricalPriceArguments {
  from: Caip19AssetType;
  to: Caip19AssetType;
}
```

The type for an `onAssetHistoricalPrice` handler function’s return value is:

```typescript
type OnAssetHistoricalPriceResponse = {
    // The UNIX timestamp of when the historical price was last updated.
  conversionTime: number;
  // The UNIX timestamp of when the historical price will expire.
  expirationTime?: number;

  historicalPrice: {
    // The interval key MUST follow the ISO 8601 duration format. The `all`
    // value is a special interval that represents all available data.
    [interval: string]: [number, string][]; // Timestamp (UNIX time), price
  }
};
```

## Appendix I: Fungible Asset Metadata

The following asset metadata fields for a fungible asset are defined.
As of the time of creation of this SIP, they are the only possible assets requested by clients.

```typescript
// Represents an asset unit.
type FungibleAssetUnit = {
  // Human-friendly name of the asset unit.
  name: string;

  // Ticker symbol of the asset unit.
  symbol: string;

  // Number of decimals of the asset unit.
  decimals: number;
};

// Fungible asset metadata.
type FungibleAssetMetadata = {
  // Human-friendly name of the asset.
  name: string;

  // Ticker symbol of the asset's main unit.
  symbol: string;

  // Represents a fungible asset
  fungible: true;

  // Base64 data URI or URL representation of the asset icon.
  iconUrl: string;

  // List of asset units.
  units: FungibleAssetUnit[];
};

// Represents the metadata of an asset.
type AssetMetadata = FungibleAssetMetadata
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).

[caip-19]: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md
