# bamazonCustomer
**Purpose:**
This application allows a user to choose a product from a list of available items in an inventory, specify a quantity and then choose to order the goods. 

**Instructions**
1. Upon intiating the node application _node bamazonCustomer.js_, the user is presented with a table of products and prices sourced from the products table of a database from which they may choose to order a quantity of an item.
1. A succession of prompts then guides the user into selecting a product, nominating a quantity of units, confirming the order and placing the order. Data validation prevents use of text, empty entries or invalid entries (eg text where a number is expected, no entry or entry of an id that does not exist in the database respectively).
1. The user has the option to proceed or cancel the order at the point of order confirmation.
    1. If choosing to proceed with the offer, it is executed and a message confirming the way in which the order will proceed is provided (which product, how many and whether any are on back order or not). Additional options for proceeding are offered if the order is unable to be filled from stock and requires back ordering. The database is updated if the order is filled or, in the case where the entire order cannot be covered by stock, a back order is created to fill the order as requested by the user.
    1. If choosing to cancel the order, it is purged. 
1. At the conclusion of ordering, the user is offered the chance to review other products or exit the application.
    1. If choosing to exit, the user is called a Legend or a whiny little bitch depending on whether they bought a new paddling tool or not
    1. If the user chooses to review and other items of stock, they are shown the products table again and the process starts again from 1.
 