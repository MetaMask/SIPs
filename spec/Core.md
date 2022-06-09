# Snap Core Specification

## Table of Contents

- [Snap Core Specification](#snap-core-specification)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [Language](#language)
  - [Snap Manifest](#snap-manifest)
    - [Permissions](#permissions)

## Overview

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

## Snap Manifest

The Snap package MUST include a `snap.manifest.json` file.

> The formal schema can be found [here](../assets/spec/core/snap_manifest_json.schema.json)

### Permissions

Standardized permissions inside `initialPermissions` field are as follows:

- `endowment:internet` - The Snap can access the internet.
- `endowment:long-running` - The Snap can take a long time to execute and shouldn't be time-bounded

Specific implementations MAY provide additional permissions specific to their use-cases.
