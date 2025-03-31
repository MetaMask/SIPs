---
sip: 23
title: JSX for Snap interfaces
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/137
author: Maarten Zuidhoorn (@mrtenz)
created: 2024-03-22
---

## Abstract

This proposal presents a specification for the use of JSX (JavaScript XML) in
Snap interfaces. It includes a set of definitions, components, and rules for
usage. The document delves into the details of various components such as
`SnapElement`, `SnapComponent`, and `SnapNode`. It also elaborates on specific
elements like , `Address`, `Bold`, `Button`, and `Text` among others, explaining
their structure and purpose.

Moreover, the proposal takes into account backward compatibility considerations.
It outlines a systematic approach to translate the components from the previous
SIP-7 format into the newly proposed format.

The proposal aims to create a more robust, flexible, and versatile system for
Snap interfaces. It strives to enhance the user experience and improve the
efficiency of the system by offering a structured and standardised component
framework.

## Motivation

The motivation behind this proposal is to leverage JSX, a popular syntax
extension for JavaScript, for designing and implementing Snap interfaces. JSX
offers several advantages that make it a preferred choice among developers.
Primarily, it allows for writing HTML-like syntax directly in the JavaScript
code, which makes it more readable and intuitive. This facilitates easier
development and maintenance of complex UI structures.

Furthermore, JSX is universally recognised and widely adopted in the JavaScript
community, especially within the React ecosystem. By using JSX for Snap
interfaces, we enable a vast number of developers familiar with this syntax to
contribute effectively in a shorter time frame.

Adopting JSX also ensures better integration with modern development tools and
practices. It allows for integration with linters, formatters, and type
checkers, thus improving the development workflow.

In summary, the use of JSX in Snap interfaces aims to improve developer
experience, enhance code maintainability, and ultimately, lead to the creation
of more robust and efficient Snap interfaces.

## Specification

> Formal specifications are written in TypeScript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written in
uppercase in this document are to be interpreted as described in
[RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

### Definitions

#### Key

A JSX key-like value, i.e., a `string`, `number`, or `null`.

```typescript
type Key = string | number | null;
```

#### SnapElement

A rendered JSX element, i.e., an object with a `type`, `props`, and `key`.

```typescript
type SnapElement<Props extends JsonObject = Record<string, never>> = {
  type: string;
  props: Props;
  key: Key | null;
};
```

#### SnapComponent

A JSX component, i.e., a function which accepts `props`, and returns a
`SnapElement`. All components MUST accept a `key` property in addition to the
regular props.

```typescript
type SnapComponent<Props extends JsonObject = Record<string, never>> =
  (props: Props & { key: Key }) => SnapElement<Props>;
```

#### SnapNode

A rendered JSX node, i.e., a `SnapElement`, `string`, `null`, or an array of
`SnapNode`s. Note that HTML elements are not supported in Snap nodes.

```typescript
type SnapNode =
  | SnapElement
  | string
  | null
  | SnapNode[];
```

### Interface structure

The Snap interface structure is defined using JSX components, and consists of
either:

- A container element, `Container`, which wraps the entire interface.
- A box element, `Box`, which contains the main content of the interface.
- An optional footer element, `Footer`, which appears at the bottom of the
  interface.

![Snap interface structure](../assets/sip-23/interface-structure.png)

Or:

- A box element, `Box`, which contains the main content of the interface.

#### Example

Below is an example of a simple Snap interface structure using JSX components:

```typescript jsx
<Container>
  <Box>
    <Heading>My Snap</Heading>
    <Text>Hello, world!</Text>
  </Box>
  <Footer>
    <Button>Click me</Button>
  </Footer>
</Container>
```

### JSX runtime

The JSX runtime is a set of functions that are used to render JSX elements,
typically provided by a library like React. Since Snap interfaces are rendered
in a custom environment, the JSX runtime MUST be provided by the Snaps platform.

The Snaps JSX runtime only supports the modern JSX factory functions, i.e.,
`jsx` and `jsxs`. The runtime MUST NOT support the legacy `createElement` and
`Fragment` functions.

Both the `jsx` and `jsxs` functions MUST return a `SnapElement`.

## Backward compatibility

To ensure backward compatibility with the previous SIP-7 format, the legacy
components MUST be translated into the new JSX format.

This SIP does not cover the translation process in detail, but simply outlines
the components and rules for usage in the new format. All features and
functionalities of the previous format are supported in the new format, so
existing Snap interfaces can be easily translated into the new format.

Most components in the new format have a one-to-one correspondence with the
components in the previous format. The `Text` component in the new format
replaces the Markdown syntax in the previous format, and the `Bold`, `Italic`,
and `Link` components can be used to achieve similar effects. The `Box`
component in the new format replaces the `panel` component in the previous
format.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
