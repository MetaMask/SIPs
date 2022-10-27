---
sip: 6
title: Deterministic Snap-specific entropy
status: Draft
discussions-to: (Http/Https URL)
author: Maarten Zuidhoorn (@Mrtenz)
created: 2022-10-27
---

## Abstract

This SIP describes a way for Snaps to get some deterministic Snap-specific entropy, based on the secret recovery phrase
of the user and the snap ID. Since Snaps do not have access to the secret recovery phrase directly, other Snaps are
unable to get the same entropy.

Snaps can optionally specify a salt in order to generate different entropy for different use cases, for example, some
entropy to derive new private keys from, and some other entropy to encrypt some data.

The entropy can be accessed from within a Snap, using the `snap_getEntropy` JSON-RPC method.

## Motivation

Before this SIP, Snaps did not have a way to get some kind of deterministic entropy, without storing it on the disk. If
the user deletes the Snap, or deletes the data of MetaMask, this entropy is lost. This SIP proposes a new way to get
deterministic entropy, which is tied to the secret recovery phrase of the user, combined with the Snap ID. In this case,
the entropy can always be re-created, as long as the user has a copy of their secret recovery phrase.

## Specification

> Formal specifications are written in TypeScript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",
"NOT RECOMMENDED", "MAY", and "OPTIONAL" written in uppercase in this document are to be interpreted as described in
[RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Deriving the entropy

Entropy is derived using a
[BIP 32](https://github.com/bitcoin/bips/blob/6545b81022212a9f1c814f6ce1673e84bc02c910/bip-0032.mediawiki) derivation
path. This derivation path MUST start with the magic value `0xd36e6170` (`1399742832'` in BIP 32 notation). The
following eight indices are based on a hash of the Snap ID, with an optional salt. The hashing algorithm of choice is
`keccak256`.

The hash of the Snap ID is calculated as follows:

```typescript
const hash = keccak256(snapId + keccak256(salt));
```

If the salt is not provided, an empty string MUST be used instead:

```typescript
const hash = keccak256(snapId + keccak256(''));
```

The hash is then split into eight big endian `uint32 | 0x80000000` integers. The resulting derivation path is a
combination of the magic value, and the eight integers:

```typescript
const computedDerivationPath = getUin32Array(hash).map((index) => (index | 0x80000000) >>> 0);
const derivationPath = [0xd36e6170, ...computedDerivationPath];
```

The entropy is then derived using the secret recovery phrase of the user, and the derivation path. The derivation
algorithm of choice is `secp256k1`. The entropy is the private key of the derived key pair.

```typescript
const { privateKey: entropy } = bip32Derive(secretRecoveryPhrase, derivationPath);
```

`bip32Derive` is defined as the `CKDpriv` function in
[BIP 32](https://github.com/bitcoin/bips/blob/6545b81022212a9f1c814f6ce1673e84bc02c910/bip-0032.mediawiki), using a root
node created as per
[BIP 39](https://github.com/bitcoin/bips/blob/6545b81022212a9f1c814f6ce1673e84bc02c910/bip-0039.mediawiki).

### `snap_getEntropy` JSON-RPC method

The `snap_getEntropy` JSON-RPC method is used to get the entropy for a Snap. It takes a single parameter, which is an
object with the following properties:

- `salt` (optional, `string`): A salt to use when deriving the entropy. If provided, this MUST be interpreted as a UTF-8
  string value. If not provided, an empty string MUST be used instead.

```json
{
  "method": "snap_getEntropy",
  "params": {
    "salt": "foo"
  }
}
```

The method returns a `string` containing the entropy, encoded as a hexadecimal string.

## Reference implementation

```typescript
import { SLIP10Node } from '@metamask/key-tree';
import { concatBytes, stringToBytes } from '@metamask/utils';
import { keccak_256 as keccak256 } from '@noble/hashes/sha3';

const MAGIC_VALUE = 0xd36e6170;
const HARDENED_VALUE = 0x80000000;

/**
 * Get an array of `uint32 | 0x80000000` values from a hash. The hash is assumed
 * to be 32 bytes long.
 *
 * @param hash - The hash to derive indices from.
 * @returns The derived indices.
 */
const getUint32Array = (hash: Uint8Array) => {
  const array = [];
  const view = new DataView(hash.buffer, hash.byteOffset, hash.byteLength);

  for (let index = 0; index < 8; index++) {
    const uint32 = view.getUint32(index * 4);
    array.push((uint32 | HARDENED_VALUE) >>> 0);
  }

  return array;
};

/**
 * Get a BIP-32 derivation path, compatible with `@metamask/key-tree`, from an
 * array of indices. The indices are assumed to be a `uint32 | 0x80000000`.
 *
 * @param indices - The indices to get the derivation path for.
 * @returns The derivation path.
 */
const getDerivationPath = (indices: number[]) => {
  return indices.map((index) => `bip32:${index - HARDENED_VALUE}'` as const);
};

/**
 * Derive deterministic Snap-specific entropy from a mnemonic phrase. The
 * snap ID and salt are used to derive a BIP-32 derivation path, which is then
 * used to derive a private key from the mnemonic phrase.
 *
 * The derived private key is returned as entropy.
 *
 * @param mnemonicPhrase - The mnemonic phrase to derive entropy from.
 * @param snapId - The ID of the Snap.
 * @param salt - An optional salt to use in the derivation. If not provided, an
 * empty string is used.
 */
const getEntropy = async (
  mnemonicPhrase: string,
  snapId: string,
  salt = ''
): Promise<string> => {
  const snapIdBytes = stringToBytes(snapId);
  const saltBytes = stringToBytes(salt);

  // Get the derivation path from the snap ID.
  const hash = keccak256(concatBytes([snapIdBytes, keccak256(saltBytes)]));
  const computedDerivationPath = getUint32Array(hash);

  // Derive the private key using BIP-32.
  const { privateKey } = await SLIP10Node.fromDerivationPath({
    derivationPath: [
      `bip39:${mnemonicPhrase}`,
      ...getDerivationPath([MAGIC_VALUE, ...computedDerivationPath]),
    ],
    curve: 'secp256k1',
  });

  if (!privateKey) {
    throw new Error('Failed to derive private key.');
  }

  return privateKey;
};
```

## Test vectors

TODO.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
