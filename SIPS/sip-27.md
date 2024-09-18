---
sip: 27
title: Accounts Metadata Request
status: Draft
author: Olaf Tomalka (@ritave)
created: 2024-09-17
---

## Abstract

This SIP allows snaps to retrieve metadata related to accounts that exist in the extension.

## Motivation

The intention of this SIP is to allow snaps providing new accounts for new chains to be able to list all accounts when selecting one during transfers.

## Specification

> Indented sections like this are considered non-normative.

> Usage of `CAIP-N` specifications, where `N` is a number, are references to [Chain Agnostic Improvement Proposals](https://github.com/ChainAgnostic/CAIPs).

Formal specification of the proposed changes in the SIP. The specification must be complete enough that an implementation can be created from it.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP specifies a permission named `keyring_listAccountsAll`. This permission grants a snap the ability to retrieve account metadata through an RPC call.

The permission is specified in `snap.manifest.json` as follows:

```json
{
  "initialPermissions": {
    "keyring_listAccountsAll": {}
  }
}
```

### RPC Method

> Notice

This SIP exposes a new RPC method called `keyring_listAccountsAll` with no additional parameters.

The RPC call returns with the following data:

```typescript
type Account = {
  id: string; // An extension-specific unique ID
  address: string; // A blockchain specific public address for the account.
  name: string; // User-given nickname for the account in the extension
  chains: string[]; //
};

type Keyring_ListAccountsAllResult = Account[];
```

> Notice that multiple `Account`s can have the same `address`, for example when there are two hardware wallets using the same seed.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
