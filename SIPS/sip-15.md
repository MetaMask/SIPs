---
sip: 15
title: Snaps Home Page
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/115
author: Frederik Bolding (@frederikbolding)
created: 2023-10-26
---

## Abstract

This SIP proposes a new API that allows snaps to surface a static UI to display data that may be useful to users of the snap. This proposal outlines some of the details around this feature.

## Motivation

Snaps currently tend to leverage separate websites for showing details relating to the status of the snap. For example, snaps that manage new blockchain accounts for users have to rely almost exclusively on these to show balances on new kinds of networks. This proposal aims to start improving on this by giving snaps a surface directly in the client where they can render custom UI. 

This new surface differs from the existing custom UI surfaces as it isn't reactionary, instead of being triggered by an RPC call or a transaction being confirmed the user can choose to view the home page screen at any time.

## Specification

> Formal specifications are written in Typescript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP specifies a permission named `endowment:page-home`.
The permission signals to the platform that the snap wants to use the home page functionality.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "endowment:page-home": {}
  }
}
```

### Snap Implementation

When a user navigates to the snap home page, the `onHomePage` handler will be invoked. This handler MUST be used to generate the UI content for the home page.

Any snap that wishes to expose a home page MUST implement the following API:

```typescript
import { panel, text } from "@metamask/snap-ui";
import { OnHomePageHandler } from "@metamask/snap-types";

export const onHomePage: OnHomePageHandler = async () => {
  const content = panel([text('Hello world!')])
  return { content };
};
```

The `onHomePage` handler takes no arguments and MUST return a value that matches the following interface:
 
```typescript
import { Component } from "@metamask/snap-ui";
interface OnHomePageResponse {
  content: Component;
}
```


## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
