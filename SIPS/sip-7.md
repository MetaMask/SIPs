---
sip: 7
title: Snaps UI
status: Draft
discussions-to: https://github.com/wallet/SIPs/discussions/71
author: Frederik Bolding (@FrederikBolding), Maarten Zuidhoorn (@Mrtenz), Olaf Tomalka (@ritave)
created: 2022-10-27
---

# Abstract

This SIP proposes a way for Snaps to compose custom UIs using the existing implemented components of the wallet extension, while keeping security intact. The proposal specifies how a Snap can specify a UI using JSON, manage user input and update the UI on the fly. For this, this specification outlines a number of JSON-RPC methods for implementation.

This will allow for an improved user experience and better customization over the existing user interface solution for Snaps.

# Motivation

One of the most requested features in Snaps is the ability to create a custom user interface. This should be done in such a way that it has the same look and feel as wallet, while still distinguishable from the main wallet user interface. By using a JSON-based format, Snaps can define their own user interface in a way that is safe to implement.

# Specification

> Formal specifications are written in TypeScript.

## Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119.](https://www.ietf.org/rfc/rfc2119.txt)

## Definitions

A Surface is place in the wallet UI in which a snap can expose it's own components.

> Example Surfaces would be a dialog window, [transaction insights](./sip-3.md), creating an account flow.

An Action is an external change in the UI system, started either by the user, or the snap.

> Example Actions would be change of text input, press of a button, request to close the dialog.

## Components

An interface created by a snap SHALL be declarative in form of a JSON-serializable JavaScript value.

## Base Components

All component types inside UI declaration SHALL be derived from either `Parent` or `Literal`.

### Node

The base type for all the components.

```typescript
interface Node {
  type: string;
}
```

### Parent

```typescript
interface Parent extends Node {
  children: Node[];
}
```

### Literal

```typescript
interface Literal extends Node {
  value: any;
}
```

## Core Components

> Defining a complete set of components used in the wallet is outside of scope for this SIP.
>
> Only a core set of components is defined, delegating definition of a complete set of useful components to other SIPs.

### UI Root

```typescript
type UIRoot = Panel | Panel[];
```

- `UIRoot` - The root of the custom UI hierarchy. A UI hierarchy MUST be always nested inside a flat list of Panels.

### Panel

```typescript
interface Panel extends Parent {
  type: "panel";
  children: Node[];
}
```

- `Panel` - A block of visually grouped components.

## Permissions

## Communication with the wallet

A snap intending to use the custom UI SHOULD expose a `ui` object using CommonJS.

```typescript
module.exports.ui = new MyUI();
```

The interface for the exposed object is as follows

```typescript

// Specific Surfaces definitions are out of scope for this SIP.
type Surface = string;
type InputAction = { id?: string; value?: JSON };
type OutputAction = { ui?: UI; action?: "close" };

type OnChangeArguments =
type OnPressArguments = { surface: Surface; ui: UI; action: Action };

interface SnapUI {
  onEntry(entry: { surface: Surface });
  onChange(change: { surface: Surface, action: InputAction, });
  onPress(press: { surface: Surface, action: InputAction, });
}
```

<!----------------------------------------------------------------------------------------------
<!-- Left a list of component definitions to be moved into a separate SIP with Living status. --
<!----------------------------------------------------------------------------------------------

### Initial components

This SIP describes a couple of components for the initial version of the UI:

1. A panel component, which renders a list of `children` components.
2. A heading component, rendering the text as a HTML heading (`h1`, `h2`, `h3`, and so on).
   1. The heading is rendered dynamically based on the nesting of panels, i.e.:
      1. A heading in a panel at the root SHOULD render a `h1`.
      2. A heading in a panel nested in the root panel SHOULD render a `h2`.
      3. etc.
3. A plain text component, rendering the text as a HTML paragraph (`p`).
4. A button component, rendering the text as a HTML button (`button`), with an optional ID for handling user input.
   1. The button can have two variants: `primary` and `secondary`.
   2. If the variant is not specified, `primary` SHOULD be used.
5. A divider component, rendering a HTML thematic break (`hr`).
6. A spacer component, pushing content around it to the top and bottom, similar to how `flex-grow` works.
7. A spinner component, rendering a spinner to indicate loading data.

```tsx
type ComponentType =
  | "panel"
  | "heading"
  | "text"
  | "button"
  | "divider"
  | "spacer"
  | "spinner";

interface PanelComponent extends BaseComponent {
  type: "panel";
  children: Component[];
}

interface HeadingComponent extends BaseComponent {
  type: "heading";
  text: string;
}

interface TextComponent extends BaseComponent {
  type: "text";
  text: string;
}

interface ButtonComponent extends BaseComponent {
  type: "button";
  variant?: "primary" | "secondary";
  text: string;
  name?: string;
}

interface DividerComponent extends BaseComponent {
  type: "divider";
}

interface SpacerComponent extends BaseComponent {
  type: "spacer";
}

interface SpinnerComponent extends BaseComponent {
  type: "spinner";
}

type Component =
  | PanelComponent
  | HeadingComponent
  | TextComponent
  | ButtonComponent
  | DividerComponent
  | SpacerComponent
  | SpinnerComponent;
```

-->

# Copyright

Copyright and related rights waived via [CC0](../LICENSE).
