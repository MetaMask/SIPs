---
sip: 30
title: Entropy Source Identifiers
status: Draft
author: Shane T Odlum (@shane-t)
created: 2024-12-17
---

## Abstract

This SIP proposes additions to entropy retrieval APIs that allows snaps to request entropy from a specific source.

## Motivation

Interoperability snaps and account management snaps use the methods `snap_getEntropy`, `snap_getBip44Entropy`, `snap_getBip32Entropy`, and `snap_getBip32PublicKey` to generate addresses and other key material.

These methods assume the client contains a single entropy source (the user's primary keyring mnemonic). The proposed API changes will allow snaps to request entropy from a specific source such as a secondary mnemonic. A new method `snap_listAvailableEntropySources` will be added to allow snaps to request a list of available entropy sources.

## Specification

> Formal specifications are written in TypeScript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",
"NOT RECOMMENDED", "MAY", and "OPTIONAL" written in uppercase in this document are to be interpreted as described in
[RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

A new set permission is added to the snap manifest:

```json
{
  "initialPermissions": {
    "snap_listAvailableEntropySources": {}
  }
}
```


### Common Types
```typescript
type Slip10Node = {
  depth: number;
  parentFingerprint: number;
  index: number;
  privateKey: string;
  publicKey: string;
  chainCode: string;
  curve: "ed25519" | "secp256k1";
};

export type BIP44Node = {
  coin_type: number;
  depth: number;
  privateKey: string;
  publicKey: string;
  chainCode: string;
  path: string[];
};

interface EntropySource {
  name: string;
  id: string;
  type: "mnemonic";
}
```

### Scope

This SIP applies to snaps that implement the [Keyring API][keyring-api] and any others which use the `snap_getEntropy`, `snap_getBip44Entropy`, `snap_getBip32Entropy`, and `snap_getBip32PublicKey` methods.

### Snap Manifest

No changes are required to the snap manifest.

### Client wallet implementation

If a snap requests a list of available entropy sources, and it has the permission to do so, the wallet MUST return a list of `EntropySource` objects.

If a snap requests entropy and includes the `source` parameter for an entropy source of type `mnemonic`, the wallet MUST return entropy corresponding to that source, if it exists.

If the source does not exist, the wallet MUST respond with an error.

If the request does not include the `source` parameter, the wallet MUST return entropy from the default source.

A client wallet MAY invoke the `keyring.createAccount` method with an `entropySource` parameter in the `options` object.

The `entropySource` parameter MUST be a string which uniquely identifies the entropy source to use. It is not guaranteed to be the same string visible to any other snap, but should always refer to the same source in the context of interactions between the snap and the client wallet.

#### Snap implementation

If a snap is asked to create an account via `keyring.createAccount`, and the `entropySource` parameter is provided, and the snap requires entropy to create an account,the snap SHOULD request the entropy from the specified source.

### New RPC Methods

#### `snap_listAvailableEntropySources`

The method returns an array of `EntropySource` objects, each representing an available entropy source. It is intended that the snap will display this list to the user.

```typescript
const entropySources = await snap.request({
  method: "snap_listAvailableEntropySources",
});
// [
//   { name: "Phrase 1", id: "phrase-1" },
//   { name: "Phrase 2", id: "phrase-2" },
// ]
```

### Existing RPC Methods

#### `snap_getEntropy`

##### Parameters
An object containing:

- `version` - The number 2. Version `2` is the first version that allows specifying a source ID.
- `salt` (optional) - An arbitrary string to be used as a salt for the entropy. This can be used to generate different entropy for different purposes.
- `source` (optional) - The ID of the entropy source to use. If not specified, the default entropy source will be used.

#### Returns
The entropy as a hexadecimal string.

#### Example

```typescript
const entropy = await snap.request({
  method: "snap_getEntropy",
  params: {
    version: 2,
    salt: "my-salt",
    source: "1234-5678-9012-3456-7890",
  },
});
// '0x1234567890abcdef'
```

#### `snap_getBip32Entropy`

##### Parameters

- `path`: An array starting with `m` containing the BIP-32 derivation path of the key to retrieve.
- `source`: The ID of the entropy source to use.
- `curve`: The curve to use - `secp256k1` or `ed25519`.

##### Returns

A `Slip10Node` object representing the BIP-32 HD tree node and containing its corresponding key material.

##### Example

```typescript
const node = await snap.request({
  method: "snap_getBip32Entropy",
  params: {
    path: ["m", "44", "0", "0", "0"],
    source: "1234-5678-9012-3456-7890",
    curve: "secp256k1",
  },
});
// {
//   depth: 5,
//   parentFingerprint: 1234567890,
//   index: 0,
//   privateKey: '0x1234567890abcdef',
//   publicKey: '0x1234567890abcdef',
//   chainCode: '0x1234567890abcdef',
//   curve: 'secp256k1',
// }
```

#### `snap_getBip32PublicKeyFromSource`

##### Parameters

- `path`: An array starting with `m` containing the BIP-32 derivation path of the key to retrieve.
- `source`: The ID of the entropy source to use.
- `curve`: The curve to use - `secp256k1` or `ed25519`.
- `compressed`: Whether to return the public key in compressed format. (defaults to `false`)

##### Returns

The public key as a hexadecimal string.

##### Example

```typescript
const publicKey = await snap.request({
  method: "snap_getBip32PublicKeyFromSource",
  params: {
    path: ["m", "44", "0", "0", "0"],
    source: "1234-5678-9012-3456-7890",
    curve: "secp256k1",
    compressed: true,
  },
});
// '0x1234567890abcdef'
```

#### `snap_getBip44Entropy`

##### Parameters
An object containing:

- `coin_type`: The BIP-44 coin type value of the node.
- `source` (optional) - The ID of the entropy source to use. If not specified, the default entropy source will be used.

##### Returns
A `BIP44Node` object representing the BIP-44 `coin_type` HD tree node and containing its corresponding key material.

##### Example

```typescript
const node = await snap.request({
  method: "snap_getBip44Entropy",
  params: {
    coin_type: 1,
    source: "1234-5678-9012-3456-7890",
  },
});
// {
//   coin_type: 1,
//   depth: 5,
//   privateKey: '0x1234567890abcdef',
//   publicKey: '0x1234567890abcdef',
//   chainCode: '0x1234567890abcdef',
//   path: ['m', '44', '0', '0', '0'],
// }
```


## Copyright

Copyright and related rights waived via [CC0](../LICENSE).

[keyring-api]: https://github.com/MetaMask/accounts/tree/main/packages/keyring-api