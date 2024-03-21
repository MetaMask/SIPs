---
sip: 22
title: Deep Links
status: Draft
author: Christian Montoya (@Montoya)
created: 2024-03-20
---

## Abstract

This SIP describes a URL scheme for Snaps entry points. This scheme can be used by Snap or dapp methods to trigger the entry point and navigate the user to that location. 

## Motivation

While some Snap entry points are reactive, meaning they can be triggered by a method, others can only be triggered by a user navigating to the location where that entry point is displayed. In order for a Snap or dapp to programmatically navigate a user to that entry point, the Snap or dapp needs a way to identify that location. The location is identified by a URL scheme, which is called a _deep link_.

## Specification

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### URL Scheme 

A URL for a deep link uses the format: 

`metamask://[Snap ID]/page/[page name]`

Where: 

- `metamask` refers to the host application 
- `[Snap ID]` refers to the canonical ID of the installed Snap
- `page` refers to a page inside of the application 
- `[page name]` refers to the canonical name of an individual page 

### Method for Navigating to a Deep Link

In order for a Snap or dapp to navigate a user to a deep link, a method is provided: 
`snap_open`. 
This method takes one parameter, which is the URL of the deep link: 

```typescript
await snap.request({
  method: 'snap_open',
  params: {
    url: 'metamask://npm:@consensys/starknet-snap/page/home'
  },
});
```

### Examples

The proposed URL for the Starknet Snap home page: 

`metamask://npm:@consensys/starknet-snap/page/home`

The proposed URL for the MetaMask Support Snap settings page: 

`metamask://npm:@consensys/web3tickets-snap/page/settings`

### Using Deep Links

A Snap can programmatically navigate a user to a deep link that leads to its own entry point. 
It can also embed deep links within its own custom UI using the deep link URL. 

For a dapp to programmatically navigate a user to a deep link for a Snap, it must first have requested permission to invoke that Snap with `wallet_requestSnaps`. 

A Snap cannot use deep links to a different Snap. _This may change in the future._

### Example Usage 

A Snap with the ID 
`npm:@consensys/starknet-snap` 
can embed a deep link in a dialog like so: 

```typescript
import type { OnInstallHandler } from '@metamask/snaps-sdk';
import { heading, panel, text } from '@metamask/snaps-sdk';

export const onInstall: OnInstallHandler = async () => {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading('Starknet Snap installed'),
        text(
          'To view your Starknet account and balances, go to the [Starknet Snap home page](metamask://npm:@consensys/starknet-snap/page/home).',
        ),
      ]);
    },
  });
};
```

A dapp connected to a Snap with the ID 
`npm:@consensys/starknet-snap` 
can programmatically navigate a user to the settings page of the Snap like so: 

```typescript 
await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@consensys/starknet-snap',
    request: { 
      method: 'snap_open',
      params: { 
        url: 'metamask://npm:@consensys/starknet-snap/page/settings'
      }
    }
  }
});
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).