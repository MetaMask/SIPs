---
sip: 29
title: Snap Assets API
status: Living
author: Daniel Rocha (@danroc), Guillaume Roux (@GuillaumeRx)
created: 2024-12-05
updated: 2025-05-05
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

Four methods are defined in the Snap Assets API:

Any Snap that wishes to provide asset information MUST implement the following API:

#### Get Assets Metadata

`Caip19AssetTypeOrId` - A string that represents an asset using the [CAIP-19][caip-19] standard.

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
  assets: Caip19AssetTypeOrId[];
}
```

The type for an `onAssetsLookup` handler function’s return value is:

```typescript
type OnAssetsLookupResponse = {
  assets: Record<Caip19AssetTypeOrId, AssetMetadata | null>;
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
};
```

The type for an `onAssetsConversion` handler function’s return value is:

```typescript
type AssetConversion = {
  // The rate of conversion from the source asset to the target asset represented as a decimal number in a string.
  // It means that 1 unit of the `from` asset should be converted to this amount
  // of the `to` asset.
  rate: string;

  // The UNIX timestamp of when the conversion rate was last updated.
  conversionTime: number;

  // The UNIX timestamp of when the conversion rate will expire.
  expirationTime?: number;
};


type FromAsset = Conversion["from"];

type ToAsset = Conversion["to"];

type OnAssetsConversionResponse = {
  conversionRates: Record<From, Record<To, AssetConversion | null>>;
};
```

#### Get Assets market data

```typescript
import { OnAssetsMarketDataHandler } from "@metamask/snaps-sdk";

export const onAssetsMarketData: OnAssetsMarketDataHandler = async ({
  assets
}) => {
  const marketData = /* Get market data for given `assets` */;
  return { marketData };
};
```

The type for an `onAssetsMarketData` handler function’s arguments is:

```typescript
type AssetPair = {
  from: Caip19AssetTypeOrId;
  to: Caip19AssetTypeOrId;
};

type OnAssetsMarketDataArguments = {
  assets: AssetPair[];
};
```

The type for an `onAssetsMarketData` handler function’s return value is:

```typescript
type MarketData = FungibleAssetMarketData | NonFungibleAssetMarketData;

type FromAsset = AssetPair["from"];

type ToAsset = AssetPair["to"];

type OnAssetsMarketDataResponse = {
  marketData: Record<FromAsset, Record<ToAsset, MarketData | null>>;
};
```

#### Get Assets historical price

```typescript
import { OnAssetHistoricalPriceHandler } from "@metamask/snaps-sdk";

export const onAssetHistoricalPrice: OnAssetHistoricalPriceHandler = async ({
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
type HistoricalPrice = {
  // The UNIX timestamp of when the historical price was last updated.
  updateTime: number;
  // The UNIX timestamp of when the historical price will expire.
  expirationTime?: number;

  intervals: {
    // The `all` value is a special interval that represents all available data.  
    all?: [number, string][];

    // The interval key MUST follow the ISO 8601 duration format.
    [interval: string]: [number, string][]; // Timestamp (UNIX time), price represented as a decimal number in a string
  };
};

type OnAssetHistoricalPriceResponse = {
  historicalPrice: HistoricalPrice | null;
};
```

## Appendix I: Fungible Asset Metadata & Market Data

The following asset metadata and market data fields for a fungible and non-fungible asset are defined.
As of the time of creation of this SIP, they are the only possible assets requested by clients.

### Asset Metadata

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
  name?: string;

  // Ticker symbol of the asset's main unit.
  symbol?: string;

  // Represents a fungible asset
  fungible: true;

  // Base64 data URI or URL representation of the asset icon.
  iconUrl: string;

  // List of asset units.
  units: FungibleAssetUnit[];
};
```
### Asset Market Data

```typescript
type FungibleAssetMarketData = {
  // Represents a fungible asset market data.
  fungible: true;

  // The market cap of the asset represented as a decimal number in a string.
  marketCap?: string;

  // The total volume of the asset represented as a decimal number in a string.
  totalVolume?: string;

  // The circulating supply of the asset represented as a decimal number in a string.
  circulatingSupply?: string;

  // The all time high of the asset represented as a decimal number in a string.
  allTimeHigh?: string;

  // The all time low of the asset represented as a decimal number in a string.
  allTimeLow?: string;

  pricePercentChange?: {
    // The `all` value is a special interval that represents all available data.  
    all?: number;  

    // The interval key MUST follow the ISO 8601 duration format.  
    [interval: string]: number;
  };
};
```

## Appendix II: Non-fungible Asset Metadata & Market Data

The following asset metadata fields for a non-fungible asset are defined.

### Asset Metadata
```typescript
type NonFungibleAssetCollection = {
  // Human-friendly name of the asset collection.
  name: string;

  // Ticker symbol of the asset collection.
  symbol: string;

  // The number of tokens in the collection.
  tokenCount: string;

  // The creator address of the asset.
  creator?: Caip19AssetType;

  // Base64 data URI or URL representation of the asset icon.
  imageUrl: string;
};

type NonFungibleAssetMetadata = {
  // Human-friendly name of the asset.
  name?: string;

  // Ticker symbol of the asset.
  symbol?: string;

  // Base64 data URI or URL representation of the asset image.
  imageUrl: string;

  // The description of the asset.
  description?: string;

  // Represents a non-fungible asset
  fungible: false;

  // The time at which the asset was acquired.
  // The time is represented as a UNIX timestamp. 
  acquired_at?: number;

  // Attributes of the non-fungible asset.
  attributes?: Record<string, string | number>;

  // The collection of the asset.
  collection: NonFungibleAssetCollection;
};
```

### Asset Market Data
```typescript
type NonFungibleAssetMarketData = {
  // Represents a non-fungible asset market data.
  fungible: false;

  // The last sale of one asset in the collection.
  lastSale?: {
    // The asset that was sold.
    asset: Caip19AssetTypeOrId;
    // The price at which is was sold represented as a decimal number in a string.
    amount: string;
  };

  // The top bid on the asset.
  topBid?: {
    // The asset that was sold.
    asset: Caip19AssetTypeOrId;
    // The price at which is was sold represented as a decimal number in a string.
    amount: string;
  }

  // The floor price of the collection.
  floorPrice?: {
    // The asset that is used to represent the floor price.
    asset: Caip19AssetTypeOrId;
    // The price of the asset represented as a decimal number in a string.
    amount: string;
  }

  // The rarity of the asset and its metadata.
  rarity?: {
    ranking?: {
      source: string;
      rank: number;
    }

    metadata?: Record<string, number>;
  }
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).

[caip-19]: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-19.md
