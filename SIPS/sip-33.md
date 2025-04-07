---
sip: 33
title: Contacts API for Snaps
status: Draft
author: Fabio Bozzo (@fabiobozzo)
created: 2025-04-04
---

## Abstract

This SIP proposes a new RPC method, `snap_getContacts`, that enables Snaps to access the contacts stored in a user's MetaMask contact book. This functionality would allow Snaps to enhance user experience by leveraging the user's existing contacts for features like transaction suggestions, batch payments, or contact-based notifications, while respecting user privacy and security.

## Motivation

Many blockchain applications require users to interact with specific addresses. Currently, MetaMask users can add contacts to their contact book, but Snaps cannot access this information programmatically. This leads to disjointed experiences where:

1. Users must manually copy/paste addresses from their contacts
2. Snaps may need to maintain their own separate contact lists
3. Users cannot leverage their existing contact book when interacting with Snaps

By providing Snaps with access to the user's contact book (with appropriate permissions), we can enable more powerful and personalized user experiences such as:

- Simplified transaction workflows where users can select recipients from their contacts
- Contact-based monitoring and notifications (e.g., "Alert me when this contact sends a transaction")
- Social features that leverage the user's network of known addresses
- Better transaction insights by recognizing and labeling known addresses

## Specification

### Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" written in uppercase in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)

### Snap Manifest

This SIP introduces a new permission named `snap_getContacts`. This permission grants a Snap the ability to read (but not modify) contacts from the user's MetaMask contact book.

This permission is specified as follows in `snap.manifest.json` files:

```json
{
  "initialPermissions": {
    "snap_getContacts": {}
  }
}
```

### Data Types

```typescript
/**
 * Represents a contact in the user's MetaMask address book.
 */
interface Contact {
  /**
   * The user-specified name for the contact.
   */
  name: string;
  
  /**
   * The blockchain address of the contact.
   */
  address: string;
  
  /**
   * Optional metadata for the contact.
   * These may include user-specified notes or tags.
   */
  metadata?: Record<string, string>;
}
```

### Method: `snap_getContacts`

#### Parameters

This method accepts no parameters:

```typescript
interface GetContactsParams {}
```

#### Returns

The method returns an array of contact objects:

```typescript
type GetContactsResult = Contact[];
```

#### Example

```typescript
// Request access to contacts
const contacts = await snap.request({
  method: 'snap_getContacts',
  params: {},
});

// Use contacts in a dialog
const selectedContact = await snap.request({
  method: 'snap_dialog',
  params: {
    type: 'confirmation',
    content: {
      prompt: 'Select a contact to send tokens to',
      description: 'Choose a recipient from your contacts',
      textAreaContent: JSON.stringify(contacts.map(c => `${c.name}: ${c.address}`), null, 2)
    }
  }
});
```

### Security Considerations

1. The `snap_getContacts` method MUST only provide read access to contacts. Snaps MUST NOT be able to create, update, or delete contacts.

2. The MetaMask UI MUST clearly inform users during the permission request that the Snap will have access to their contacts.

3. The implementation SHOULD consider potential privacy implications of sharing contact information with Snaps and provide appropriate controls for users.

### User Experience Considerations

1. When a Snap requests the `snap_getContacts` permission, the MetaMask UI SHOULD clearly explain what information will be shared with the Snap.

2. The implementation MAY provide users with the option to selectively share contacts with specific Snaps rather than providing access to all contacts.

## Backwards Compatibility

This SIP introduces a new method and does not modify any existing functionality. Therefore, there are no backwards compatibility concerns.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE). 