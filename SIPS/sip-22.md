---
sip: 22
title: MetaMask URL scheme (Deep Links)
status: Draft
author: Christian Montoya (@Montoya), Hassan Malik(@hmalik88)
created: 2024-09-13
---

## Abstract

This SIP describes a URL scheme for extension navigation. The described URL will allow for navigation to Snaps entry points and elsewhere within the MetaMask extension. This scheme can potentially be used by Snap methods in the future to navigate the user to a location in-client and trigger the entry point. 

## Motivation

While some Snap entry points are reactive, meaning they can be triggered by a method, others can only be triggered by a user navigating to the location where that entry point is displayed. In order for a Snap to programmatically navigate a user to that entry point, the Snap needs a way to identify that location. The location is identified by a URL scheme, and an in-client link pointing to this location is called a _deep link_.

## Specification

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### URL Scheme 

[URL syntax](https://en.wikipedia.org/wiki/URL#Syntax) is defined with a scheme, authority, path, and with optional (query and fragment) portions. This SIP defines a new scheme: `metamask:`, the syntax is defined below:

`metamask://[authority]/[path]`

Where: 

- `[authority]` refers to either `client` or `snap` (in the current case, `client` can mean either the extension or mobile version of MetaMask)
- `[path]` refers to the entire path which depending on the authority can be different
  - For the `client` authority, the following paths are available:
    - `/` - links to the client's home page
  - For the `snap` authority, the path starts with the snap ID and has the following paths available to it:
    - `/home` - leads to the snap's [home page](/SIPS/sip-15.md) (which is its settings page if it doesn't have a home page)

**Note:** In the future, fragments can potentially be used for navigation to specific portions of a page and params can be provided from a calling method for exports such as `onHome`.

### Examples

The proposed URL for the Starknet Snap home page: 

`metamask://snap/npm:@consensys/starknet-snap/home`

The URL for navigating to the extension's home page:

`metamask://client/`

### Using Deep Links

A Snap can currently use navigation from within the snaps ui `Link` component. In the future, a SIP will be drafted to allow for programmatic navigation with another RPC method.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).