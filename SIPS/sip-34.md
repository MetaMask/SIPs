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
Adding the `version` field allows us to version the API and define distinct behaviors based on the declared version.

This is useful as we want to add new fields and features that should only apply to specific versions of the API, ensuring that existing implementations relying on previous versions continue to work without modification.

Our current request "parsing" (within the keyring API) is strict and does not allow extra-fields. Meaning that current EVM Snaps might throw an error if we add new fields to some of our requests (even optional fields).

We plan to modify the `submitRequest(request)` method by adding a new `origin` field to the `request` parameter, but only for version `2` and higher.
We won't forward this `origin` field for requests made with version `1` to ensure backward compatibility.

```json
{
  "jsonrpc": "2.0",
  "id": "7c507ff0-365f-4de0-8cd5-eb83c30ebda4",
  "method": "keyring_submitRequest",
  "params": {
    "id": "c555de37-cf4b-4ff2-8273-39db7fb58f1c",
    "scope": "eip155:1",
    "account": "4abdd17e-8b0f-4d06-a017-947a64823b3d",
    "request": {
      "method": "eth_method",
      "params": [1, 2, 3]
    },
    "origin": "someOrigin"
  }
}
```

This system will allow us to introduce future versions in a flexible way, limiting the need for breaking changes when new features are added.

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
- When `version` is set to `2`, the API will allow new fields, such as the `origin` field, to be included in the request.
- Future versions will allow additional features or fields to be introduced, with conditional logic to ensure backward compatibility.

> Example of conditional behavior in `submitRequest(request)`:
> - If the `version` is `1`, the request will not include the `origin` field.
> - If the `version` is `2`, the `origin` field will be added to the request.

This new implementation MUST ensure backward compatibility with older Snaps.
- Snaps using the existing `endowment:keyring` configuration object will continue to function without modification.
- New functionalities, will only be enabled for Snaps that declare `"version": 2` (or above).
- As more versions are introduced, **each versions will have its own set of features or modifications, ensuring that older versions continue to operate as expected**.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
