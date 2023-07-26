---
sip: 7
title: Snaps UI
status: Draft
discussions-to: https://github.com/MetaMask/SIPs/discussions/71
author: Frederik Bolding (@FrederikBolding), Maarten Zuidhoorn (@Mrtenz), Guillaume Roux (@GuillaumeRx)
created: 2022-10-27
---

## Abstract

This SIP proposes a way for Snaps to compose custom UIs using the existing implemented components of the MetaMask extension, while keeping security intact. The proposal specifies how a Snap can specify a UI using JSON, manage user input and update the UI on the fly. For this, this specification outlines a number of JSON-RPC methods for implementation.

This will allow for an improved user experience and customisability over the existing user interface solution for Snaps.

## Motivation

One of the most requested features in Snaps is the ability to create a custom user interface. This should be done in such a way that it has the same look and feel as MetaMask, while still distinguishable from the main MetaMask user interface. By using a JSON-based format, Snaps can define their own user interface in a way that is safe to implement.

## Specification

> Formal specifications are written in TypeScript.

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",  "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119.](https://www.ietf.org/rfc/rfc2119.txt)

### Definitions

```tsx
type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [prop: string]: Json };
```

### Components

This SIP proposes that Snaps compose their own UIs using the existing MetaMask components, but for the sake of simplicity and security, we only allow this composition via JSON.

A user interface definition is therefore a JSON object composed of different types of components, which on render will be converted to React by the MetaMask extension.

All components will derive from a base component and have at a minimum a `type`.

```tsx
interface BaseComponent {
  type: string;
};
```

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
4. A submit button component, rendering the text as a HTML button (`button`) of type `submit`, with an optional ID for handling user input.
    1. The button can have two variants: `primary` and `secondary`.
    2. If the variant is not specified, `primary` SHOULD be used.
5. A divider component, rendering a HTML thematic break (`hr`).
6. A spacer component, pushing content around it to the top and bottom, similar to how `flex-grow` works.
7. A spinner component, rendering a spinner to indicate loading data.
8. A copyable component, rendering the value along a copy icon that copies the value in the clipboard.
9. A form component, which renders a list of `children` components to define a form, with an ID for handling user input.
10. A text input component, rendering an HTML input (`input`) of type `text` with an ID for handling user input.
  1. An aditional label MUST optionally be rendered if defined in the `label` field.
11. A password input component, rendering an HTML input (`input`) of type `password` with an ID for handling user input.
  1. An aditional label MUST optionally be rendered if defined in the `label` field.
12. A number input component, rendering an HTML input (`input`) of type `number` with an ID for handling user input.
  3. An aditional label MUST optionally be rendered if defined in the `label` field.


```tsx
type ComponentType = 'panel' | 'heading' | 'text' | 'button' | 'divider' | 'spacer' | 'spinner' | 'copyable' | 'form' | 'input';

interface PanelComponent extends BaseComponent {
  type: 'panel';
  children: Component[];
}

interface HeadingComponent extends BaseComponent {
  type: 'heading';
  text: string;
}

interface TextComponent extends BaseComponent {
  type: 'text';
  value: string;
}

interface ButtonComponent extends BaseComponent {
  type: 'button';
  variant?: 'primary' | 'secondary';
  buttonType: 'button'
  value: string;
  name?: string;
}

interface SubmitButtonComponent extends BaseComponent {
  type: 'button';
  variant?: 'primary' | 'secondary';
  buttonType: 'submit'
  value: string;
  name?: string;
}

interface DividerComponent extends BaseComponent {
  type: 'divider';
}

interface SpacerComponent extends BaseComponent {
  type: 'spacer';
}

interface SpinnerComponent extends BaseComponent {
  type: 'spinner';
}

interface CopyableComponent extends BaseComponent {
  type: 'copyable';
  value: string;
}

interface FormComponent extends BaseComponent {
  type: 'form';
  name: string;
  children: Component[];
}

interface TextInputComponent extends BaseComponent {
  type: 'input';
  value?: string;
  name: string;
  inputType: 'text'
  placeholder?: string;
  label?: string;
}

interface PasswordInputComponent extends BaseComponent {
  type: 'input';
  value?: string;
  name: string;
  inputType: 'password'
  placeholder?: string;
  label?: string;
}

interface NumberInputComponent extends BaseComponent {
  type: 'input';
  value?: string;
  name: string;
  inputType: 'number'
  placeholder?: string;
  label?: string;
}

type Component =
  | PanelComponent
  | HeadingComponent
  | TextComponent
  | ButtonComponent
  | SubmitButtonComponent
  | DividerComponent
  | SpacerComponent
  | SpinnerComponent
  | CopyableComponent
  | FormComponent
  | TextInputComponent
  | PasswordInputComponent
  | NumberInputComponent
```

### JSON-RPC methods

#### `snap_showInterface`

The `snap_showInterface` method lets Snaps show a user interface arbitrarily. The params MUST be an object, with the following properties:

- `ui` (`Component`): The custom UI to show.

It MUST return a `string`, which is used as identifier for the user interface. This identifier MUST be unique for each invocation of this method.

```tsx
interface SnapShowInterfaceRequest {
  method: 'snap_showInterface';
  params: {
    ui: Component;
  };
}

type SnapShowInterfaceResponse = string;
```

#### `snap_updateInterface`

The `snap_updateInterface` method lets Snaps update an existing user interface. The params MUST be an object, with the following properties:

- `id` (`string`): The ID of the custom UI to update.
- `ui` (`Component`): The new custom UI to show. This will replace the existing UI.

This method does not return anything.

```tsx
interface SnapUpdateInterfaceRequest {
  method: 'snap_updateInterface';
  params: {
    id: string;
    ui: Component;
  };
}
```

#### `snap_resolveInterface`

Snaps that require user input in order to continue execution, i.e., checking if a user pressed the confirm or deny button, can use the `snap_resolveInterface` method to provide the resolved value. This is primarily intended to be used in the `onUserInput` entry point, see the section “User input” below.

The params MUST be an object, with the following properties:

- `id` (`string`): The ID of the custom UI to resolve.
- `value` (`Json`): A JSON-compatible value to resolve the interface with. This value is passed to the `snap_readInterface` call.

This method does not return anything.

```tsx
interface SnapResolveInterfaceRequest {
  method: 'snap_resolveInterface';
  params: {
    id: string;
    value: Json;
  };
}
```

#### `snap_readInterface`

Snaps that require user input in order to continue execution, i.e., checking if a user pressed the confirm or deny button, can use the `snap_readInterface` method to read the resolved value.

The params MUST be an object, with the following properties:

- `id` (`string`): The ID of the custom UI to read.

This method returns the resolved value. If the interface is not resolved yet, this method MUST wait until the interface is resolved, before returning a value.

```tsx
interface SnapReadInterfaceRequest {
  method: 'snap_readInterface';
  params: {
    id: string;
  };
}

type SnapReadInterfaceResponse = Json;
```

#### `snap_getInterfaceState`

The `snap_getInterfaceState` method lets snaps retrieve an existing user interface state. The interface state contains the values of the different stateful components (forms, inputs, ...) entered in the UI. The params MUST be an object, with the following properties:

- `id` (`string`): The ID of the custom UI to read.

This method returns the interface state.

```tsx
interface SnapGetInterfaceStateRequest {
  method: 'snap_getInterfaceState';
  params: {
    id: string;
  };
}

type SnapReadInterfaceResponse = Json;
```

### User input

To handle user input in Snaps UI, a snap can expose a new entry point `onUserInput`.

```tsx
type OnUserInput =
  (args: { id: string; event: UserInputEvent }) => Promise<void>;
```

The args MUST be an object, with the following properties:

- `id` (`string`): The ID of the custom UI which triggered the event.
- `event` (`UserInputEvent`): An object that represents the event triggered.

The entry point will be called with appropriate events for the user’s interaction with the Snaps UI.

```tsx
interface ButtonClickEvent extends UserInputEvent {
  type: 'ButtonClickEvent';
  name?: string;
}

interface InputChangeEvent extends UserInputEvent {
  type: 'InputChangeEvent';
  name: string;
  value: string;
}

interface FormSubmitEvent extends UserInputEvent {
  type: 'FormSubmitEvent';
  name: string;
  value: Record<string, string>;
}

type UserInputEvent = ButtonClickEvent | InputChangeEvent | FormSubmitEvent;
```

#### `ButtonClickEvent`

This event SHOULD be called when a button, outside of a form context (submit button), is pressed. If the button component specifies a name, this name MUST be set as `name` on the event.

#### `InputChangeEvent`

This event SHOULD be called when an input value is changed. The input name MUST be set as `name` on the event and the new value MUST be set as `value` on the event.

#### `FormSubmitEvent`

This event SHOULD be called when a form is submited via a type `submit` button. The form name MUST be set as `name` on the event and the record containing the form input values MUST be set as `value` on the event.

### Transaction insights

This SIP replaces the type of the `onTransaction` entry point as defined in [SIP 3](https://metamask.github.io/SIPs/SIPS/sip-3). The `onTransaction` entry point MUST return an object, with the insights as `Component`.

```tsx
// The `onTransactionArgs` interface from SIP 3.
interface OnTransactionArgs {
  transaction: Record<string, unknown>;
}

// The new return value.
interface OnTransactionReturn {
  insights: Component;
}

type OnTransaction = (args: OnTransactionArgs) => Promise<OnTransactionReturn>;
```

### Example

The Snaps UI may also be used similarly to `snap_dialog`, but SHALL NOT be supported by `snap_dialog` itself. Instead, it may be used as so:

```tsx
export const onRpcRequest = async () => {
  const id = await wallet.request({
    method: 'snap_showInterface',
    params: {
      ui: {
        type: 'panel',
        children: [
          /* Loading interface. */
        ],
      },
    },
  });

  const data = await fetch(/* ... */);

  // Update user interface based on new `data`.
  await wallet.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: {
        type: 'panel',
        children: [
          /* Some components based on the `data`. */
        ],
      },
    },
  });

  return await wallet.request({
    method: 'snap_readInterface',
    params: {
      id,
    },
  });
};

// Triggered by a potential button in the UI
export const onUserInput = async ({ event, id }) => {
  await wallet.request({
    method: 'snap_resolveInterface',
    params: {
      id,
      value: 'foo',
    },
  });
};
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE).
