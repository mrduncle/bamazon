# bamazonCustomer
**Purpose:**

This application allows a user to choose a product from a list of available items in an inventory, specify a quantity and then choose to order the goods. 

**Instructions:**
1. Upon intiating the node application _node bamazonCustomer.js_, the user is presented with a table of products and prices sourced from the products table of a database from which they may choose to order a quantity of an item.
1. A succession of prompts then guides the user into selecting a product, nominating a quantity of units, confirming the order and placing the order. Data validation prevents use of text, empty entries or invalid entries (eg text where a number is expected, no entry or entry of an id that does not exist in the database respectively).
1. The user has the option to proceed or cancel the order at the point of order confirmation.
    1. If choosing to proceed with the offer, it is executed and a message confirming the way in which the order will proceed is provided (which product, how many and whether any are on back order or not). Additional options for proceeding are offered if the order is unable to be filled from stock and requires back ordering. The database is updated if the order is filled or, in the case where the entire order cannot be covered by stock, a back order is created to fill the order as requested by the user. Fields updated in the database include the remaining stock (reduced by the quantity in the order for the product chosen), back order quantity (adjusted if any additional items were required to be added to the back order quantity) and productsales (adjusted to add the value of the current order to the existing value in the productsales column).
    1. If choosing to cancel the order, it is purged. 
1. At the conclusion of ordering, the user is offered the chance to review other products or exit the application.
    1. If choosing to exit, the user is called a Legend or a whiny little bitch depending on whether they bought a new paddling tool or not, the database connection is closed and the application finishes.
    1. If the user chooses to review and/or order other items of stock, they are shown the products table again and the process starts again from 1.


# bamazonManager
**Purpose:**

This application permits manager level reporting and access to the database for the purpose of some low level database management activities. The functions are detailed below. 

**General:**

Upon intiating the node application _node bamazonManager.js_, the manager is presented with four database management level options to choose from:
1. View products for sale
1. View low inventory
1. Add to inventory
1. Add new product

**View products for sale:**
1. Upon choosing this option, the contents of the products table from the bamazon database are displayed.
1. The manager is then presented with options to exit or go back to the main menu.
    1. If the manager chooses to exit, the database connection is closed and the application finishes
    1. If the manager chooses to go back to the main menu, they are navigated back to the restart at the General section above.

**View low inventory:**
1. Upon choosing this option, the contents of the products table with an inventory level lower than five from the bamazon database are displayed.
1. The manager is then presented with options to exit or go back to the main menu.
    1. If the manager chooses to exit, the database connection is closed and the application finishes
    1. If the manager chooses to go back to the main menu, they are navigated back to the restart at the General section above.

**Add to inventory:**
1. Upon choosing this option, the manager is presented with a list of the products available in the products table of the bamazon database to choose from for the purpose of updating.
1. The manager chooses the product to update.
1. The manager is prompted to enter the quantity of units to be added to the inventory. This entry has validation requiring a non-zero number.
1. If the product has a non-NULL and non-nil back order quantity in the products table, the manager is prompted to confirm the number of units to be added to inventory if it doesn't match the back order quantity.
    1. Choosing to not proceed results in the manager being reprompted for the quantity of units to be added to the inventory.
    1. 






    1. If choosing to proceed with the offer, it is executed and a message confirming the way in which the order will proceed is provided (which product, how many and whether any are on back order or not). Additional options for proceeding are offered if the order is unable to be filled from stock and requires back ordering. The database is updated if the order is filled or, in the case where the entire order cannot be covered by stock, a back order is created to fill the order as requested by the user.
    1. If choosing to cancel the order, it is purged. 
1. At the conclusion of ordering, the user is offered the chance to review other products or exit the application.
    1. If choosing to exit, the user is called a Legend or a whiny little bitch depending on whether they bought a new paddling tool or not
    1. If the user chooses to review and/or order other items of stock, they are shown the products table again and the process starts again from 1.
 