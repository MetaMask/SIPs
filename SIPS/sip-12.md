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

Currently, the MetaMask wallet allows for ENS domain resolution.
The implementation is hardcoded and limited to just the ENS protocol.
In an effort to increasingly modularize the wallet and allow for resolution beyond ENS, we decided to open up domain/address resolution to snaps.
A snap would be able to provide resolutions based on a domain or address provided with a chain ID.
The address resolution is in essence "reverse resolution".
The functionality provided by this API is also beneficial as a base layer for a petname system (**see definition**). With plans to bring petnames to MetaMask, resolutions would be fed into the petname system and used as a means for cache invalidation.

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

- `AccountAddress` - The account address portion of a [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md) ID.

- `Petname system` - A naming system that finds balance between global, collision-free and memorable names. Please see this [article](http://www.skyhunter.com/marcs/petnames/IntroPetNames.html) on this topic.

### Snap Manifest

This SIP specifies a permission named `endowment:name-lookup`.
The permission grants a snap the ability to expose an `onNameLookup` export that receives an object with `chainId` and `domain` OR `address` fields.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:name-lookup": {
        "chains": ["eip155:1", "bip122:000000000019d6689c085ae165831e93"],
        "matchers": { "tlds": ["lens"], "schemes": ["farcaster"] }
    }
  }
}
```

`chains` - An optional non-empty array of CAIP-2 chain IDs that the snap supports. This field is useful for a client in order to avoid unnecessary overhead.

`matchers` - An optional non-empty object that MUST contain 1 or both of the below properties. These matchers are useful for a client for validating input for domain resolution, also helpful in reducing overhead.
  1. `tlds` - An optional non-empty array of top level domains that the snap will provide resolution for.

  2. `schemes` - An optional non-empty array of prefixes that the snap expects for non-tld domain lookup.

**Note:** TLD domains are presumed to end with "." and one of the `tlds`. Non-tld domains are presumed to start with one of the `schemes` followed by ":" then the domain. Respectively, an example of each would be `hassan.lens` and `farcaster:hbm88`.  

### Snap Implementation

Please see below for an example implementation of the API:

```typescript
import { OnNameLookupHandler } from "@metamask/snap-types";

export const onNameLookup: OnNameLookupHandler = async ({
  chainId,
  domain,
  address
}) => {
  let resolution;

  if (domain) {

    resolution = { protocol: /* Domain protocol */ , resolvedAddress: /* Get domain resolution */ };
    return { resolvedAddresses: [resolution] };
  } 
  
  if (address) {
    resolution = { protocol: /* Domain protocol */, resolvedDomain: /* Get address resolution */ };
    return { resolvedDomains: [resolution] };
  }

  return null;
};
```

The type for an `onNameLookup` handler function's arguments is:

```typescript
type OnNameLookupBaseArgs = { 
  chainId: ChainId
}

type DomainLookupArgs = OnNameLookUpBaseArgs & { domain: string; address?: never };
type AddressLookupArgs = OnNameLookUpBaseArgs & { address: string; domain?: never };

type OnNameLookupArgs = DomainLookupArgs | AddressLookupArgs;

```

`chainId` - This is a [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) `chainId` string.
The snap is expected to parse and utilize this string as needed.

`domain` - This is a human-readable address. If the `domain` property is defined, the request is looking for resolution to an address.

`address` - This is a non-readable address, this should be the native address format of the currently selected chain/protocol. If the `address` property is defined,
the request is looking for resolution to a domain.

The interface for the return value of an `onNameLookup` export is:

```typescript
type AddressResolution = {
  protocol: string;
  resolvedAddress: AccountAddress;
};

type DomainResolution = {
  protocol: string;
  resolvedDomain: string;
};

type OnNameLookupResponse =
  | {
      resolvedAddresses: NonEmptyArray<AddressResolution>;
      resolvedDomains?: never;
    }
  | { resolvedDomains: NonEmptyArray<DomainResolution>; resolvedAddresses?: never }
  | null;
```

**Note:** 
1. The `resolvedDomain` or `resolvedAddress` in a resolution object MUST be the key that the address or domain being queried is indexed by in the protocol that the snap is resolving for. These returned values are un-opinionated at the API layer to allow the client to use them as they see fit.
2. There MUST NOT be duplicate resolutions for the same protocol in either `resolvedAddresses` or `resolvedDomains`.
3. `protocol` refers to the name of the protocol providing resolution for said `resolvedAddress`/`resolvedDomain`.
4. The returned resolution(s) MUST exist on the chain specificed by the `chainId` passed into the handler.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
