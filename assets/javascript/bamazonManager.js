let inquirer = require("inquirer");
let mySQL = require("mysql");
let addInvent = [];
let newProd = [];
let deptNames = [];

// let purchaseObject = {};
// let qtyBackOrder;

let connection = mySQL.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
})

function endConn() {
    connection.end(function(err){
        if (err) throw err;
        console.log("\n\nMySQL connection closed.");
        //end connection to MySQL
    })  
}

function addVisProdID(visID) {
    //update the record with the derivative visProductID
    connection.query("UPDATE products SET visproductID = ? WHERE productID = ?",
        [parseInt(visID - 1), parseInt(visID)], function (err, results) {
            if (err) throw err;
            console.log("Your new record has been entered into the database.");
    })
}

function addProduct() {
    //create the new record by inserting the compulsory fields 
    console.log("INSERT INTO products (productname, departmentname, price, stockqty, backorder) " + 
    "VALUES (" +
    newProd[0] + 
    ", " + newProd[1] + 
    ", " + newProd[2] +
    ", " + newProd[3] +
    ", " + newProd[4] + ")");
    connection.query("INSERT INTO products (productname, departmentname, price, stockqty, backorder) " + 
                     "VALUES ('" +
                     newProd[0] + 
                     "', '" + newProd[1] + 
                     "', " + newProd[2] +
                     ", " + newProd[3] +
                     ", " + newProd[4] + ")", function(err, rows) {
                         if (err) throw err;
                         //get the auto generated ID of the inserted record
                         connection.query("SELECT LAST_INSERT_ID()", function(err, results){
                            if (err) throw err;
                            addVisProdID(results[0]["LAST_INSERT_ID()"]);
                     })
    })
}

function checkProd() {
    //ask the user to confirm their data entry
    console.log("\n\nYou have entered the following information for the new record: " +
                "\nProduct Name: " + newProd[0] + 
                "\nDepartment Name: " + newProd[1] + 
                "\nPrice: " + newProd[2] +
                "\nStock Quantity: " + newProd[3] + 
                "\nBack Order: " + newProd[4]);
    inquirer
        .prompt ([
            {
                type: "list",
                name: "recordOk",
                message: "Are you happy with the details of the entry?",
                choices: ["Yes", "No"],
                default: "Yes"
            }
        ])
        .then(answers => {
            if(answers.recordOk === "Yes") {
                addProduct();
            }
            else {
                newProductEntry();
            }
        })
}

function newProductEntry() {
    //have the user enter data for the new record
    inquirer
        .prompt([
            {
                name: "product",
                message: "\nWhat is the name of the new product?"
            },
            {
                type: "list",
                name: "department",
                message: "\nPlease choose which department the new product belongs to.",
                choices: deptNames,
                default: "Pyranha"
            },
            {
                name: "price",
                message: "\nWhat price is this product to be sold for?"
            },
            {
                name: "stock",
                message: "\nHow many of this new product are in stock?"
            },
            {
                name: "backorder",
                message: "\nHow many of this product are on back order?"
            }
        ])
        .then(answers => {
            newProd = [answers.product, answers.department
                       ,answers.price, answers.stock
                       ,answers.backorder];
            checkProd();
        })
}

function prepNewProd() {
    //obtain all the data from the database necessary for new product
    connection.query("SELECT DISTINCT departmentname FROM products",
    function(err, rows) {
        if (err) throw err;
        rows.forEach(element => {
            deptNames.push(element.departmentname)
        })
        console.log(deptNames);
        newProductEntry();
    })
}

function addInventory() {
    //update the stock quantity held and the back order amount
    connection.query("UPDATE products SET stockqty = ?, backorder = ? WHERE productname = ?", 
        [addInvent.quantity, addInvent.back, addInvent.productupdate], function(err, rows) {
            if (err) {
                throw err;
            }
            else {
                console.log("\n\nDatabase updated for " + addInvent.productupdate + " with a final quantity in stock" +
                " of " + addInvent.quantity + " units and a backorder quantity of " + addInvent.back + " units.")
            }
            endConn();
        })
}

function backOrder(qty) {
    //resolve the method of dealing with the back order quantity
    if (parseInt(qty) > addInvent.back) { //the increase in stock levels exceeds the current back order so set back order to zero
        console.log("\n\nThe back order quantity will be set to zero and the update amount will be added to any current stock");
        addInvent.back = 0;
        addInventory();
    }
    else {
        inquirer
            .prompt([
                {
                    type: "list",
                    name: "resolveback",
                    message: "\n\nPlease select an option for updating the backorder value which is currently " + addInvent.back + " units.",
                    choices: ["subtract current incoming quantity from back order amount"
                             ,"set backorder quantity to zero"
                             ],
                    default: "subtract current incoming quantity from back order amount"
                }
            ])
            .then(answers => {
                if (answers.resolveback === "set backorder quantity to zero") { //artificially set back order amount to zero
                    addInvent.back = 0;
                }
                else {
                    addInvent.back = parseInt(addInvent.back - qty); //set back order amount to current level minus the new inventory increase
                }
                addInventory();
            })
    } 
}

function checkValidNo(qty) {
    //check if the increase in inventory entered by the user is valid
    if (isNaN(qty)) { //is the data entered a number
        console.log("\n\nPlease enter a valid number");
        howMany();
    }
    else {
        addInvent.quantity = addInvent.products.find(obj => obj.product === addInvent.productupdate).quantity + parseInt(qty);
        addInvent.back = addInvent.products.find(obj => obj.product === addInvent.productupdate).backorder;
        if (addInvent.back === null) addInvent.back = 0;
        if (parseInt(qty) !== addInvent.back) {
            inquirer
                .prompt([ //confirm if the mismatched new inventory quantity vs back order level is acceptable
                    {
                        type: "list",
                        name: "checkqty",
                        message: "\n\nThere are " + addInvent.back + " units on back order for the " + addInvent.productupdate +
                            " which\nis different from the " + qty + " units you nominated " + 
                            "as the update\nquantity. Do you still wish to proceed?",
                        choices: ["Yes", "No"],
                        default: "Yes"
                    }
                ])
                .then(answers => { 
                    if (answers.checkqty === "No") { //mismatch is not okay ask for data re-entry
                        console.log("\n\nPlease re-enter the correct number of units to add to inventory for " + addInvent.productupdate + ".")
                        howMany();
                    }
                    else { //mismatch is okay
                        backOrder(qty);
                    }
                })
        }
        else { //back order amount and new inventory quantity are equal
            addInvent.back = parseInt(addInvent.back - qty);
            addInventory();
        }
    }      
}

function howMany() {
    //ask the user how many additional units are to be added
    inquirer
        .prompt([
            {
                name:"addinventqty",
                message: "\n\nHow many additional units do you wish to add?"
            }
        ])
        .then(answers => {
            checkValidNo(answers.addinventqty);
        })           
} 
    

function whichProduct() {
    //ask which product the user wishes to update
    inquirer
        .prompt([
            {
                type: "list",
                name: "addInventProd",
                message: "\n\nWhich product would you like to add more inventory to?",
                choices: addInvent.productnames,
                default: addInvent.productnames[0]
            }
        ])
        .then(answers => {
            addInvent.productupdate = answers.addInventProd;
            howMany();
        })
}

function prepInvent() {
    //obtain all the data from the database necessary for the update
    connection.query("SELECT productname, stockqty, backorder FROM products",
    function(err, rows) {
        if (err) throw err;
        addInvent.products = [];
        //create an array of objects containing the productname, stockqty and backorder
        rows.forEach(element => {
            addInvent.products.push({product: element.productname,
                                    quantity: element.stockqty,
                                    backorder: element.backorder
                                    })
        });
        //from the array of objects collect into a single array the product name of each object
        addInvent.productnames = addInvent.products.map(prod => prod.product);
        whichProduct();
    });
}

function displayLowInvent() {
    //display all products with a stockqty less than 5
    connection.query("SELECT productID, productname, price, stockqty, backorder FROM products " +
        "WHERE stockqty < ?", 5, function(err, rows, fields) {
            if (err) throw err;
            console.table(rows);
            endConn();
        })
}

function displayProducts() {
    //display all products
    connection.query("SELECT productID, productname, price, stockqty, backorder FROM products",
        function(err, rows, fields) {
            if (err) throw err;
            console.table(rows);
            endConn();
    })
}

function displayOptions() {
    //ask the manager what they would like to do
    inquirer
        .prompt([
            {
                type: "list",
                name: "mgrOptions",
                message: "Which of the following would you like to do?",
                choices: ["View products for sale"
                         ,"View low inventory"
                         ,"Add to inventory"
                         ,"Add new product"],
                default: "View products for sale"
            }
        ])
        .then(answers => {
            if (answers.mgrOptions === "View products for sale") {
                displayProducts();
            }
            else if (answers.mgrOptions === "View low inventory") {
                displayLowInvent();
            }
            else if (answers.mgrOptions === "Add to inventory") {
                prepInvent();
            }
            else {
                prepNewProd();
            }
        })
}

displayOptions();