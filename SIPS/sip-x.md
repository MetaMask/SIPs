### Snap Improvement Proposal (SIP)

**Title:** Address Insights

**SIP Number:** [To be assigned]

**Author:** Dan Finlay <dan.finlay@consensys.net> 

#### Abstract

This SIP proposes a new custom permission for MetaMask Snaps. The permission will enable Snaps to provide additional UI annotations when an Ethereum address is presented within the MetaMask interface. The Snap will respond to events involving Ethereum addresses with a custom UI, enhancing user experience with contextual information or actions related to the address.

#### Specification

1.  **Permission Name:** `endowment:address-annotation`

2.  **Permission Description:**

    -   Allows a Snap to receive events containing Ethereum addresses.
    -   Snap can provide UI annotations or additional information for these addresses.
3.  **Manifest Configuration:**

    json

1.  `"initialPermissions": {
      "endowment:address-annotation": {}
    }`

2.  **Event Handling:**

    -   Implement an event listener in the Snap to handle incoming Ethereum addresses.
    -   The event will provide the Ethereum address as an argument.
3.  **UI Annotation:**

    -   Utilize the `@metamask/snaps-ui` module to create custom UI components.
    -   Example components: `panel`, `heading`, `text`, `image`.
    -   The UI should be contextually relevant to the address provided.
4.  **Use Cases:**

    -   Displaying additional information about an address, like its trustworthiness or associated metadata.
    -   Providing quick actions related to an address, such as adding it to a watchlist or checking its transaction history.

**Rich Example:**

    javascript

`import { panel, heading, text, image, divider } from '@metamask/snaps-ui';

function handleAddressEvent(address) {\
  // Example logic to generate insights based on the address\
  const addressInsight = getAddressInsight(address);

  // Custom UI components\
  const addressPanel = panel([\
    heading(`Details for ${address}`),\
    text(`Insight: ${addressInsight.description}`),\
    divider(),\
    image(addressInsight.imageUrl),\
    text(`Additional Info: ${addressInsight.additionalInfo}`)\
  ]);

  return addressPanel;\
}

function getAddressInsight(address) {\
  // Placeholder for logic to fetch or compute insights about the address\
  return {\
    description: "Trusted Address with High Volume Transactions",\
    imageUrl: "data:image/svg+xml;base64,...", // Base64 encoded SVG or data URI\
    additionalInfo: "This address is associated with a well-known NFT marketplace."\
  };\
}`

a new permission that does not affect existing permissions or Snap functionalities. It is fully backward compatible.


#### Rationale

This permission extends the functionality of MetaMask Snaps by allowing developers to create more interactive and informative experiences. Address-related context is crucial in blockchain interactions, and providing users with additional insights directly within MetaMask can enhance security and usability.

#### Backward Compatibility

This SIP introduces a new permission that does not affect existing permissions or Snap functionalities. It is fully backward compatible.

#### Security Considerations

- Security frame these annotations when they are displayed. 
- May need to truncate excessive length messages. 

