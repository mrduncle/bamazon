//@ts-check

let inquirer = require("inquirer");
let mySQL = require("mysql");
let addInvent = [];
let newProd = [];
let deptNames = [];

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
        //end connection to MySQL
        console.log("\n\nMySQL connection closed.");
    })  
}

function nextTask() {
    inquirer
        .prompt ([
            {
                type: "list",
                name: "nextStep",
                message: "\n\nWhat would you like to do then?\n\n",
                choices: ["Re-enter the record", "Go back to the main menu", "Exit entirely"],
                default: "Re-enter the record"
            },
        ])
        .then( answers => {
            if (answers.nextStep === "Re-enter the record") newProductEntry();
            else if (answers.nextStep === "Go back to the main menu") displayOptions();
            else endConn();
        })
}

function addVisProdID(visID) {
    //update the record with the derivative visProductID
    connection.query("UPDATE products SET visproductID = ? WHERE productID = ?",
        [parseInt(visID - 1), parseInt(visID)], function (err, results) {
            if (err) throw err;
            console.log("\n\nYour new record has been entered into the database.");
            whatNext();
    })
}

function addProduct() {
    //create the new record by inserting the compulsory fields 
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
                "\n====================================" +
                "\nProduct Name: " + newProd[0] + 
                "\nDepartment Name: " + newProd[1] + 
                "\nPrice: " + newProd[2] +
                "\nStock Quantity: " + newProd[3] + 
                "\nBack Order: " + newProd[4] + 
                "\n====================================");
    inquirer
        .prompt ([
            {  //user happy for the INSERT to proceed
                type: "list",
                name: "recordOk",
                message: "\n\nAre you happy with the details of the entry?",
                choices: ["Yes", "No"],
                default: "Yes"
            },
        ])
        .then(answers => {
            if(answers.recordOk === "Yes") {
                addProduct(); //INSERT the new product into the database
            }
            else nextTask()  //query what the user wants to do       
        })
}

function chkPrices(descriptor) {
    //confirm that the entered price is not out of the normally expected range
    inquirer
        .prompt([
            {
                type: "list",
                name: "valueOut",
                message: "\n\nYour price of $" + newProd[2] + " per unit seems a little " + descriptor + ". Do you wish to adjust it?",
                choices: ["Yes", "No"],
                default: "Yes"
            },
            {  //this question only exposed to the user when the users responds in the affirmative to adjusting the price
                type: "input",
                name: "newPrice",
                message: "\n\nWhat is the new price?",
                when: (answers) => answers.valueOut === "Yes", //this question only asked when the response from the above is yes
                validate: function (value) { //validate for non-numerical and empty entries
                    if (isNaN(value) || value === "") {
                        return "Please enter a valid price.";
                    }
                    else {
                        return true;
                    }
                }
            }
        ]).then(answers => {
            if (answers.valueOut === "Yes") {
                newProd[2] = answers.newPrice;
            }
            checkProd();
            
        })

    
}

function newProductEntry() {
    //have the user enter data for the new record
    let priceMsg = "\nWhat price is this product to be sold for?";
    let stockMsg = "\nHow many of this new product are in stock?";
    let backOrdMsg = "\nHow many of this product are on back order?";

    inquirer
        .prompt([
            {  //product name
                type: "input",
                name: "product",
                message: "\nWhat is the name of the new product?",
                validate: function (value) { //validate empty entries
                    if (value !== "") {
                        return true;
                    }
                    else{
                        return "Please enter a product name."
                    }
                }
            },
            {  //department
                type: "list",
                name: "department",
                message: "\nPlease choose which department the new product belongs to.",
                choices: deptNames,
                default: "Pyranha"
            },
            {  //price
                type: "input",
                name: "price",
                message: priceMsg,
                validate: function (value) { //validate for non-numerical and empty entries
                    if (isNaN(value) || value === "") {
                        return "Please enter a valid price.";
                    }
                    else return true;
                }
            },
            {  //current stock of new product
                type: "input",
                name: "stock",
                message: stockMsg,
                validate: function (value) { //validate for non-numerical and empty entries
                    if (isNaN(value) || value === "") {
                        return "Please enter a valid number for the stock quantity.";
                    }
                    else {
                        return true;
                    }
                }
            },
            {  //back order quantity of new product
                type: "input",
                name: "backorder",
                message: backOrdMsg,
                validate: function (value) { //validate for non-numerical and empty entries
                    if (isNaN(value) || value === "") {
                        return "Please enter a valid number for the back order quantity.";
                    }
                    else {
                        return true;
                    }
                }
            }
        ])
        .then(answers => {   
            newProd = [answers.product, answers.department
                       ,answers.price, answers.stock
                       ,answers.backorder];
            //check for prices outside a normally expected range
            let descriptor;
            if (newProd[2] < 700) {
                descriptor = "low";
                chkPrices(descriptor);
            }
            else if (newProd[2] > 2000) {
                descriptor = "high";
                chkPrices(descriptor);
            }
            else { //within normal range do final check of entered data
                checkProd();
            }
        })
}

function prepNewProd() {
    //obtain all the data from the database necessary for adding a new product
    connection.query("SELECT DISTINCT departmentname FROM products",
    function(err, rows) {
        if (err) throw err;
        rows.forEach(element => {
            deptNames.push(element.departmentname)
        })
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

function prepNo(qty) {
    //check if the increase in inventory entered by the user is valid
    //find the quantity currently in stock for the product addInvent.productupdate
    addInvent.quantity = addInvent.products.find(obj => obj.product === addInvent.productupdate).quantity + parseInt(qty);
    //find the current back order quantity for the product addInvent.productupdate
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
                if (answers.checkqty === "No") { //user has decided mismatch is not okay ask for data re-entry
                    console.log("\n\nPlease re-enter the correct number of units to add to inventory for " + addInvent.productupdate + ".")
                    howMany();
                }
                else { //user has decided mismatch is okay
                    backOrder(qty);
                }
            })
    }
    else { //back order amount and new inventory quantity are equal
        addInvent.back = parseInt(addInvent.back - qty);
        addInventory();
    }
}      

function howMany() {
    //ask the user how many additional units are to be added
    inquirer
        .prompt([
            {
                name:"addinventqty",
                message: "\n\nHow many additional units do you wish to add?",
                validate: function (value) {  //validate for non-numerical and empty entries
                    if (isNaN(value) || value === "") {
                        return "Please enter a valid number for the additional units."
                    }
                    else return true;
                }
            }
        ])
        .then(answers => {
            prepNo(answers.addinventqty)
        })           
} 
    

function whichProduct() {
    //ask which product the user wishes to update from the array obtained in prepInvent()
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
    //obtain all the data from the database necessary for the inventory update
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
        //for use in whichProduct()
        addInvent.productnames = addInvent.products.map(prod => prod.product);
        whichProduct();
    });
}

function displayLowInvent() {
    //display all products with a stockqty less than 5
    connection.query("SELECT productID, departmentname, productname, price, stockqty, backorder FROM products " +
        "WHERE stockqty < ? ORDER BY departmentname", 5, function(err, rows, fields) {
            if (err) throw err;
            console.table(rows);
            whatNext();
        })
}

function whatNext() {
    inquirer
        .prompt ([
            {
                type: "list",
                name: "nextStep",
                message: "\n\nWhat would you like to do now?\n",
                choices: ["Go back to the main menu", "Exit entirely"],
                default: "Exit entirely"
            },
        ])
        .then( answers => {
            if (answers.nextStep === "Go back to the main menu") displayOptions();
            else endConn();
        })
}

function displayProducts() {
    //display all products
    connection.query("SELECT productID, departmentname, productname, price, stockqty, " +
        "backorder FROM products ORDER BY departmentname",
        function(err, rows, fields) {
            if (err) throw err;
            console.table(rows);
            whatNext();
    })
}

function displayOptions() {
    //ask the manager what they would like to do
    inquirer
        .prompt([
            {
                type: "list",
                name: "mgrOptions",
                message: "\nWhich of the following would you like to do?",
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