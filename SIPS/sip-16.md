---
sip: 16
title: Signature Insights
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/118
author: Christian Montoya (@Montoya), Hassan Malik (@hmalik88)
created: 2023-11-01
---

## Abstract

This SIP proposes a way for Snaps to provide "insights" into signatures requested by dapps. These insights can then be displayed in the MetaMask confirmation UI, helping the user to make informed decisions before signing messages.

Example use cases for signature insights are phishing detection, scam prevention and signature simulation.

This SIP closely follows [SIP-3: Transaction Insights](sip-3.md) and [SIP-11: Transaction insight severity levels](sip-11.md).

## Motivation

One of the most difficult problems blockchain wallets solve for their users is "signature comprehension," i.e. making cryptographic signature inputs intelligible to the user.
A signature in the wrong hands can give an attacker the ability to steal user assets. 
A single wallet may not be able to provide all relevant information to any given user for any given signature request.
To alleviate this problem, this SIP aims to expand the kinds of information MetaMask provides to a user before signing a message.

The current Snaps API in the MetaMask extension already has a "transaction insights" feature that allows Snaps to decode transactions and provide insights to users. 
These transaction insights can also specify a transaction severity level to provide extra friction in the transaction confirmation. 
To expand on this feature, this SIP allows the community to build Snaps that provide arbitrary "insights" into signatures in a similar manner.
These insights can then be displayed in the MetaMask UI alongside any information provided by MetaMask itself.
Signature insight Snaps can also return a `severity` key to indicate the severity level of the content being returned. 
This key uses the same `SeverityLevel` enum used by transaction insight Snaps. 

## Specification

> Formal specifications are written in Typescript. Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs).

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Definitions

> This section is non-normative, and merely recapitulates some definitions from [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md).

- `ChainId` - a [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) string.
  It identifies a specific chain among all blockchains recognized by the CAIP standards. The ChainId refers to the network that the signing account is connected to. It is not necessarily the network where the signed message will be broadcast. 
  - `ChainId` consists of a `Namespace` and a `Reference`
    - `Namespace` - a class of similar blockchains. For example EVM-based blockchains.
    - `Reference` - a way to identify a concrete chain inside a `Namespace`. For example Ethereum Mainnet or one of its test networks.
- `Method` - a string which can be any of the following 4 [signing methods](https://docs.metamask.io/wallet/concepts/signing-methods/) supported by the MetaMask wallet API. The set of possible signature types may expand in the future as new signing methods are supported. The signing method is required by MetaMask for the dapp to make a signature request. It is not part of the signature payload.
  1. `eth_signTypedData_v4`
  2. `eth_signTypedData_v3`
  3. `eth_signTypedData_v1`
  4. `personal_sign`

### Snap Manifest

This SIP specifies a permission named `endowment:signature-insight`.
The permission grants a Snap read-only access to raw signature payloads, before they are accepted for signing by the user.

The permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:signature-insight": {}
  }
}
```

The permission includes an OPTIONAL caveat `allowSignatureOrigin`. 
The caveat grants a Snap read-only access to the URL requesting the signature.
It can be specified as follows: 

```json
{
  "initialPermissions": {
    "endowment:signature-insight": {
      "allowSignatureOrigin": true
    }
  },
}
```

### Snap Implementation

The following is an example implementation of the API:

```typescript
import { OnSignatureHandler, SeverityLevel } from "@metamask/snaps-sdk";

export const onSignature: OnSignatureHandler = async ({
  signature: Record<string, unknown>,
  signatureOrigin: string, /* If allowSignatureOrigin is set to true */
}) => {
  const content = /* Get UI component with insights */;
  const isContentCritical = /* Boolean checking if content is critical */
  return isContentCritical ? { content, severity: SeverityLevel.Critical } : { content };
};
```
The interface for an `onSignature` handler function’s arguments is:

```typescript
interface OnSignatureArgs {
  signature: Record<string, unknown>;
  signatureOrigin?: string;
}
```

`signature` - The signature object is intentionally not defined in this SIP because different chains may specify different signature formats.
It is beyond the scope of the SIP standards to define interfaces for every chain.
Instead, it is the Snap developer's responsibility to be cognizant of the shape of signature objects for relevant chains.
Nevertheless, you can refer to [Appendix I](#appendix-i-ethereum-signature-objects) for the interfaces of the Ethereum signature objects available in MetaMask at the time of this SIP's creation.

`signatureOrigin` - The URL origin of the signature request. The existence of this property is dependent on the `allowSignatureOrigin` caveat.


The interface for the return value of an `onSignature` export is:

```typescript
interface OnSignatureResponse {
  content: Component | null;
  severity?: SeverityLevel;
}
```

**Note:** `severity` is an OPTIONAL field and the omission of such means that there is no escalation of the content being returned.

## Specification

Please see [SIP-3](sip-3.md) for more information on the original transaction insights API.

Please see [SIP-7](sip-7.md) for more information on the `Component` type returned in the `OnTransactionResponse`.

Please see [SIP-11](sip-3.md) for more information on Transaction insight severity levels.

## Appendix I: Ethereum Signature Objects

The following signature objects may appear for any `chainId` of `eip155:*` where `*` is some positive integer. This includes all Ethereum or "EVM-compatible" chains. As of the time of the creation of this SIP, they are the only possible signature objects for Ethereum chains.

### personal_sign

```typescript
interface PersonalSignature {
  from: string;
  data: string;
  signatureMethod: 'personal_sign';
}
```

### eth_signTypedData

```typescript
interface SignTypedDataSignature {
  from: string;
  data: Record<string, any>[];
  signatureMethod: 'eth_signTypedData';
}
```

### eth_signTypedData_v3

```typescript
interface SignTypedDataV3Signature {
  from: string;
  data: Record<string, any>;
  signatureMethod: 'eth_signTypedData_v3';
}
```

### eth_signTypedData_v4

```typescript
interface SignTypedDataV4Signature {
  from: string;
  data: Record<string, any>;
  signatureMethod: 'eth_signTypedData_v4';
}
```

**Note**: The `signatureMethod` property is MetaMask specific and not reflective of the standards defining the underlying signature methods. `signatureMethod` SHOULD be used by the signature insight snap as the source of the truth to identify the signature scheme it is providing insights for.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
