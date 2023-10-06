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
  let checkConnectionDetails: { message, dangerType } = ajaxCallToRemoteAPI(domain);

  if ( dangerType === 'danger' | dangerType === 'warn' ) {

    // The end user will be shown the message and dangerType (danger | warming | none) and also be 
    // asked the question: 'Do you wish to proceed and connect your wallet to the {domain}?'
    let connect: boolean = showConnectMessage(message, dangerType );

    // If the user clicked the 'No' button connect will be false, else true.
    return connect;
  }

  // connects without prompting user
  return true;
};
```

Note that OnConnectHandler is a new Handler which is part of the same event mechanism used by 
existing SNAP handlers like OnTransactionHandler, OnCronjobHandler, OnRpcRequestHandler.

See: [Snaps exports](https://docs.metamask.io/snaps/reference/exports/)

OnConnectHandler fires when    the end user is attempting to connect the dApp to their wallet.

In the above usage example, The hook can return true or false.  It returns true if the connection
should be allowed to go ahead and false if the wallet should not connect to the dApp.

There is a new function which needs to be added to the SNAP API called:

    showConnectMessage(message: string, dangerType: string): boolean

This function takes in a message and dangerType.  The message could be something like:

"Domain gooooogle.com is a phishing website.  Be Careful"

dangerType can have the following values:   danger | warning | none

"danger" means the domain is a dangerous one and one should be very vigilant.
"warning" means the domain has had some issues so one should be careful.
"none" means the domain has no reported issues.

Note that the implementation of showConnectMessage(..) MUST show the message and dangerType and also have a dialog with the additional text:

"Do you wish to proceed and connect your wallet to the {domain}?'"

This dialog has 2 buttons to respond with:

Yes - means the user wishes to connect to their wallet
No - means the user does not wish to connect to their wallet

The showConnectMessage() returns true to connect and false to not connect.

Note that the ajaxCallToRemoteAPI(domain) function above is not part of the API and is an example
of integrating this functionality with the UTU Trust network.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
