---
sip: 10
title: wallet_getLocale
status: Draft
discussions-to (*optional): (Http/Https URL)
author: Frederik Bolding (@FrederikBolding)
created: 2023-06-30
---

## Abstract

This SIP proposes an RPC method that lets Snaps access the user selected locale in MetaMask, as a way to inform their localization efforts. This proposal will outline implementation details of said RPC method.

## Motivation

Snaps that want to localize their copy used in custom interfaces etc currently has to implement their own system for letting a user select their preferred language. The proposed RPC method provides a developer experience improvement to snap developers by letting them use the user's existing and preferred localization settings.

## Specification

> Formal specifications are written in TypeScript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Proposed implementation

The proposed RPC method `wallet_getLocale` SHOULD be a restricted RPC method requiring user consent before usage via the permission system. The RPC method SHOULD only be available to Snaps.

The implementation MUST use a `getLocale` method hook for accessing the user locale. This lets each implementing client specify the function themselves, letting the RPC implementation remain platform-agnostic.

```tsx
/**
 * Builds the method implementation for `wallet_getLocale`.
 *
 * @param hooks - The RPC method hooks.
 * @param hooks.getLocale - A function that returns the user selected locale.
 * @returns The user selected locale.
 */
export function getImplementation({ getLocale }: GetLocaleMethodHooks) {
  return async function implementation(
    _args: RestrictedMethodOptions<void>,
  ): Promise<string> {
    return getLocale();
  };
}
```

```tsx
/**
 * Method hook for accessing the user locale from the PreferencesController.
 *
 * @returns The user selected locale.
 */
function getLocale(): string {
  return this.preferencesController.store.getState().currentLocale;
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
