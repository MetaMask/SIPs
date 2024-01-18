---
sip: 14
title: Dynamic Permissions
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/114
author: Frederik Bolding (@frederikbolding)
created: 2023-10-19
---

## Abstract

This SIP proposes changes to the Snap manifest and new RPC methods that allows Snap developers to request additional permissions dynamically at runtime. This proposal outlines some of the details around this feature.

## Motivation

Snaps currently have to request all permissions that they plan to use at install-time. This becomes a problem when a Snap wants to use many permissions as the installation experience suffers and the user has to either accept all permissions requested, or deny the installation. This proposal provides an improvement to the experience by letting Snaps request permissions at runtime as long as those permissions are statically defined in the manifest at build-time.

## Specification

> Formal specifications are written in Typescript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP adds a new field to the Snap manifest called `dynamicPermissions`.
This field can be used in tandem with the existing `initialPermissions`, but permissions in this field are not granted by installation: They MUST be requested when needed. The field follows the same format as `initialPermissions`.

The new field can be specified as follows in a `snap.manifest.json` file:

```json
{
  "initialPermissions": {
    "endowment:transaction-insight": {}
  },
  "dynamicPermissions": {
    "snap_dialog": {},
    "snap_getBip44Entropy": [
      {
        "coinType": 1
      },
      {
        "coinType": 3
      }
    ]
  }
}
```

### Permission caveats

Duplicated permissions in `initialPermissions` and `dynamicPermissions` MUST NOT be allowed. A permission MUST only be able to exist in one of the manifest fields.

Furthermore, permissions specified in `dynamicPermissions` MUST contain the caveats that will be requested at runtime and the permission request MUST fully match the caveats specified in the manifest.

This MAY change in a future SIP.

### RPC Methods

This SIP proposes the following RPC methods to manage the dynamic permissions:

#### snap_requestPermissions

This RPC method SHOULD function as a subset of the existing `wallet_requestPermissions` RPC method (as defined in [EIP-2255](https://eips.ethereum.org/EIPS/eip-2255)) and take the same parameters and have the same return value.

This RPC method MUST prompt the user to get consent for any requested permissions and MUST validate that the requested permissions are specified in the manifest before continuing its execution (including matching caveats).


#### snap_getPermissions

This RPC method SHOULD be an alias for `wallet_getPermissions`, and MAY be used by the Snap for verifying whether it already has the permissions needed for operating. The return value and parameters SHOULD match the existing specification defined in [EIP-2255](https://eips.ethereum.org/EIPS/eip-2255).

#### snap_revokePermissions

This RPC method SHOULD take a similar input to `wallet_requestPermissions`, an object keyed with permission names, where the values may contain caveats if applicable.

For example:

```json
{
  "method": "snap_revokePermissions",
  "params": {
    "snap_getBip32Entropy": {
      "caveats": [
        {
          "type": "permittedDerivationPaths",
          "value": [
            { "path": ["m", "44'", "60'"], "curve": "secp256k1" },
            { "path": ["m", "0'", "0'"], "curve": "ed25519" }
          ]
        }
      ]
    }
  }
}
```

The caveat information passed SHOULD be ignored in the initial implementation of this. Instead of processing the caveats, the implementation SHOULD revoke the entire permission key. We will revisit this at a later time to make it more granular.

This RPC method SHOULD return `null` if the permissions are revoked successfully, or return an error otherwise. 

This RPC method MUST validate that the permissions to be revoked do not contain any permissions specified in `initialPermissions`. Only `dynamicPermissions` can be revoked.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
