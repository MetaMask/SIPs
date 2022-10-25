---
sip: 5
title: Creating JSON Web Tokens (JWTs)
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/64
author: Vid Kersic <vid.kersic@yahoo.com> (@Vid201), Andraz Vrecko (@andyv09)
created: 2022-10-20
---

## Abstract

This SIP proposes a functionality of signing the data in the form of JSON Web Tokens (JWTs), exposed as an RPC method.

JSON Web Tokens (JWTs) are an internet standard for creating data whose payload holds claims in the JSON. The standard is widely used in many applications on the web, often for authentication and authorization purposes. Other use cases are Verifiable Credentials (VCs) and Verifiable Presentations (VPs), also part of Decentralized Identity and Self-Sovereign Identity (SSI).

## Motivation

Snaps were introduced to extend the functionalities of MetaMask to support more use cases and paradigms. MetaMask currently provides several RPC methods for digitally signing data (described [here](https://docs.metamask.io/guide/signing-data.html)), such as personal_sign and signTypedData. All methods add the prefix "\x19Ethereum Signed Message:\n" to the data, as described in [EIP 191](https://eips.ethereum.org/EIPS/eip-191) and [EIP 712](https://eips.ethereum.org/EIPS/eip-712), which prevents several attack vectors, most notably impersonating transactions. But this also prevents the ability to produce pure signatures over the data, which is needed for other internet data standards (such as JWTs). Actually, a pure signature is possible only with eth_sign, but that method was deprecated and advised not to use. Therefore, there is no safe way to create JWTs containing signatures signed by MetaMask accounts. This SIP proposes a new RPC method for Snaps that enables the creation of signed JWTs.

## Specification

> Formal specifications are written in Typescript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Definitions

JWTs are composed of three parts: header, payload, and signature. For more information, please check [JSON Web Token (JWT) Request for Comments (RFC)](https://www.rfc-editor.org/rfc/rfc7519).

### Snap Manifest

This SIP specifies permission named `snap_signJwt`. This permission grants a snap the ability to create signed JWTs by introducing an additional signing method.

This specification is specified as follows in `snap.manifest.json` files:
```typescript
{    
    "initialPermissions": {
        "snap_signJwt": {},
    }
}
```

### Common Types

The below common types are used throughout the specification.

```typescript
interface JWTHeader {
  typ: string;
  alg: string;
  [params: string]: any;
}

interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  jti?: string;
  nbf?: number;
  exp?: number;
  iat?: number;
  [claims: string]: any;
}
```

### JWT Signing Implementation

This implementation is modeled after implementations from libraries [did-jwt](https://github.com/decentralized-identity/did-jwt) and [jose](https://github.com/panva/jose).

All hash functions that are implemented in the library [ethereum-cryptography](https://github.com/ethereum/js-ethereum-cryptography) are supported, e.g., SHA256, SHA512, and keccak256.

```typescript
import * as u8a from "uint8arrays";
const { sha256 } = require("ethereum-cryptography/sha256");
const { keccak256 } = require("ethereum-cryptography/keccak");
// import other hash functions
const { utf8ToBytes } = require("ethereum-cryptography/utils");

function hexToBytes(s: string): Uint8Array {
  const input = s.startsWith("0x") ? s.substring(2) : s;
  return u8a.fromString(input.toLowerCase(), "base16");
}

function bytesToBase64url(b: Uint8Array): string {
  return u8a.toString(b, "base64url");
}

function encodeSection(data: any): string {
  return encodeBase64url(JSON.stringify(data));
}

export function encodeBase64url(s: string): string {
  return bytesToBase64url(u8a.fromString(s));
}

export async function createJWT(
  header: Partial<JWTHeader> = {},
  payload: Partial<JWTPayload> = {},
  address: string,
  hashFunction: string
): Promise<string> {
  if (!header.typ) header.typ = "JWT";
    
  const encodedPayload = (typeof payload === "string") ? payload : encodeSection(payload);
  const signingInput: string = [encodeSection(header), encodedPayload].join(
    "."
  );
  const bytes: Uint8Array = utf8ToBytes(signingInput);

  let hash: Uint8Array;

  switch(hashFunction) {
    case 'sha256':
      hash = sha256(bytes);
      break;
    case 'keccak256':
      hash = keccak256(bytes);
      break;
    ... // other hash functions
  }

  let signature = sign(hash);  // Function sign can be the same as the MetaMask RPC method eth_sign. The header and payload that will be signed MUST be shown to the user.
  signature = hexToBytes(signature.slice(0, -2)); // remove byte appended by MetaMask
  const encodedSignature = bytesToBase64url(signature);

  return [signingInput, encodedSignature].join(".");
}
```

### Snap Implementation

Any snap that needs the capability of creating JWTs can do that by calling the JSON-RPC method in the following way:

```typescript
const jwt = await wallet.request({
  method: 'snap_signJwt',
  params: [
    {
      header:  
        {
            "alg": "ES256K",
            "typ": "JWT"
        },
      payload: 
        {
            "iss": "Company",
            "sub": "Alice",
            "role": "employee"
        },
      address: '0x12345...',
      hashFunction: 'sha256'
    },
  ],
});
```

## Appendix I: JSON Web Tokens (JWTs)

Example of signed JWT:

```eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJDb21wYW55Iiwic3ViIjoiQWxpY2UiLCJyb2xlIjoiZW1wbG95ZWUifQ.E_QJXlLHIgO6xifadQRcsPty2LounknXq_O7HK3c1kZ0jGAG0pXgyAmkjqvpBtLsLNLonj3ilrrUEe5I_n9Clw```

In the example above, the header contains fields ``alg`` and ``typ``. Algorithm ``ES256K`` uses the elliptic curve ``secp256k1`` (used in Ethereum) and hash function SHA256.

```json 
{
  "alg": "ES256K",
  "typ": "JWT"
}
```

Payload is a simple JSON object:

```json
{
  "iss": "Company",
  "sub": "Alice",
  "role": "employee"
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).