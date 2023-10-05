---
sip: 13
title: Intercept connections to Wallet
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/109
author: John Dickerson (@javaspeak)
created: 2023-10-05
---

## Abstract

This SIP proposes: a new way of intercepting a connection to the wallet so that the snap can make a call to an external API to check on the security of the domain the wallet is connecting to. The snap can then decide whether it wishes to warn or reassure the end user as to the trustworthiness of the connection they are are about to make.  The end user can then decide whether they wish to continue with the connection or not.

## Motivation

In the crypto space a web domain may be malicious and drain the coins from the wallet of an unexpecting user.  Adding a snap that is able to intercept a wallet connect; perform a check; and, inform the user if there are any security issues on the address, reduces the risk of wallet transactions on the web.  UTU Trust (utu.io) builds trust in the crypto space and can provide this enhanced functionality to metamask in the form of this SIP and a snap which hits its API.

## Specification

> Formal specifications are written in Typescript. Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs).

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

No new permissions.  Will require the existing connection permission to make the ajax call to an external API.

### Snap Implementation

The following is an example implementation / usage of the API:

```typescript
import { OnConnectHandler, showConnectWarning } from "@metamask/snap-types";

export const onConnect: OnConnectHandler = async ({ 
  domain, address 
} ) => {
  let checkConnectionDetails: { message, dangerType } = ajaxCallToRemoteAPI();

  if ( dangerType === 'danger' | dangerType === 'warn' ) {

    // The end user will be shown the message and dangerType (danger | warming | none) and also be 
    // asked the question: 'Do you wish to proceed and connect your wallet to the {domain}?'
    let connect: boolean = showConnectWarning(message, dangerType );

    // If the user clicked the 'No' button connect will be false, else true.
    return connect;
  }

  // connects without prompting user
  return true;
};
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
