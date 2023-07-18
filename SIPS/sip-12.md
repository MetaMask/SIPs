---
sip: 12
title: Domain Resolution
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/103
author: Hassan Malik (@hmalik88)
created: 2023-07-18
---

## Abstract

This SIP proposes a new endowment, `endowment:name-lookup`, that enables a way for snaps to resolve a `domain` and `address` to their respective counterparts.

## Motivation

Currently, the MetaMask wallet allows for ENS domain resolution. The implementation is hardcoded and limited to just the ENS protocol. In an effort to
increasingly modularize the wallet and allow for resolution beyond ENS, we decided to open up domain/address resolution to snaps. A snap would be able
to provide resolution based on a domain or address provided with a chain ID. The address resolution is in essence "reverse resolution". The functionality provided by
this API is also beneficial as a base layer for a petname system. Resolutions can eventually be fed into the petname system and used as a means for cache invalidation.

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

This SIP specifies a permission named `endowment:name-lookup`.
The permission grants a snap access to a object with `chainId` and `domain` OR `address` fields in an `onNameLookup` export.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:name-lookup": {
        "chains": ["eip155:1", "bip122:000000000019d6689c085ae165831e93"],
    }
  }
}
```

`chains` - An array of CAIP-2 chain IDs that the snap supports. This field is useful to the extension to avoid unnecessary overhead.

### Snap Implementation

Any snap that wishes to provide name lookup features **MUST** implement the following API:

```typescript
import { OnNameLookupHandler } from "@metamask/snap-types";

export const onNameLookup: OnNameLookupHandler = async ({
  chainId,
  domain,
  address
}) => {
  let resolution;
  if (domain) {
    const getAddress = (domain) => /* Get address */;
    resolution = getAddress(domain);
  } else if (address) {
    const getDomain = (address) => /* Get domain */;
    resolution = getDomain(address);
  } else {
    return null;
  }

  return { resolution };
};
```

The type for an `onNameLookup` handler function’s arguments is:

```typescript
type OnNameLookupArgs = {
  chainId: Caip2ChainId;
} & ({ domain: string, address: undefined } | { address: string, domain: undefined });

```

`chainId` - This is a [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) `chainId` string.
The snap is expected to parse and utilize this string as needed.

`domain` - This is a human-readable address. If the `domain` property is defined, the request is looking for resolution to an address.

`address` - This is a non-readable address, this should be the native address format of the currently selected chain/protocol. If the `address` property is defined,
the request is looking for resolution to a domain.

The interface for the return value of an `onNameLookup` export is:

```typescript
type Domain = string;

type OnNameLookupResponse = {
  resolution: AccountAddress | Domain;
} | null;
```

### MetaMask Integration

The resolution returned by the snap will be displayed in the send flow for those chains that have integrated UI for their send flow, which currently are EVM chains. The intention is for this to
exist across non-EVM chains when we reach the stage of send flow integration for protocol snaps.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
