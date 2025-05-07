---
sip: 34
title: endowment:keyring.version
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/172
author: Charly Chevalier (@ccharly), Daniel Rocha (@danroc)
created: 2025-04-07
---

## Abstract

This proposal introduces a new field, `version`, within the existing configuration object used by the `endowment:keyring`.
This field will allow the versioning of the keyring API, providing the flexibility to define the current API version being used.
By declaring the version in the configuration, we can implement conditional behavior in the API based on the selected version.
This will allow us to modify or add new functionality in the API without breaking backward compatibility.

## Motivation

The current `endowment:keyring` configuration does not support versioning, which limits our ability to introduce breaking changes or new functionality that may require changes in behavior.
Adding a `version` field would allow us to version the API and define distinct behaviors based on the declared version, limiting the need for breaking changes when new features are added.

Existing implementations relying on previous versions will continue to work without modification.

## Specification

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

### Proposed implementation

Add an OPTIONAL `version` field to the `endowment:keyring` configuration object.
This field will be a `number` and will defaults to `1` if not provided to maintain compatibility with existing implementations.

   ```json
   {
     "endowment:keyring": {
       "version": 2,
       "allowedOrigins": [
         ...
       ]
     }
   }
   ```

On the keyring API implementation side, we will modify our API methods to conditionally behave based on the `version`:
- When `version` is set to `1`, the API will behave as it currently does.
- When `version` is set to `2`, the API will introduce new incompatible behaviors/features with version `1`.
- Future versions will allow additional breaking features, with conditional logic to ensure backward compatibility.

This new implementation MUST ensure backward compatibility with older Snaps.
- Snaps using the existing `endowment:keyring` configuration object will continue to function without modification.
- New functionalities, will only be enabled for Snaps that declare `"version": 2` (or above).
- As more versions are introduced, **each versions will have its own set of features or modifications, ensuring that older versions continue to operate as expected**.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
