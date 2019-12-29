let inquirer = require("inquirer");
let mySQL = require("mysql");
let addProduct = []
let addInvent = [];
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

function addInventory() {
    // console.log("addInvent.quantity: " + addInvent.quantity);
    // console.log("addInvent.back: " + addInvent.back);
    connection.query("UPDATE products SET stockqty = ?, backorder = ? WHERE productname = ?", 
        [addInvent.quantity, addInvent.back, addInvent.productupdate], function(err, rows) {
            if (err) {
                throw err;
            }
            else{
                console.log("\n\nDatabase updated for " + addInvent.productupdate + " with a final quantity in stock" +
                " of " + addInvent.quantity + " units and a backorder quantity of " + addInvent.back + " units.")
            }

            endConn();
        })
}

function backOrder(qty) {
    // console.log(typeof(addInvent.back) + addInvent.back);
    // console.log(typeof(qty) + qty);
    // console.log(parseInt(qty));
    // console.log(addInvent.back);
    if (parseInt(qty) > addInvent.back) {
        console.log("\n\nThe back order quantity will be set to zero and the update amount will be added to any current stock");
        addInvent.back = 0;
        addInventory();
    }
    else {
        inquirer
            .prompt ([
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
                if (answers.resolveback === "set backorder quantity to zero") {
                    addInvent.back = 0;
                }
                else {
                    // console.log("not backorder set to 0");
                    // console.log(typeof(addInvent.back));
                    // console.log(typeof(qty));
                    addInvent.back = parseInt(addInvent.back - qty);
                    // console.log("new back order amount: " + addInvent.back);
                }
                addInventory();
            })
    } 
}

function checkValidNo(qty) {
    if (isNaN(qty)) {
        console.log("\n\nPlease enter a valid number");
        howMany();
    }
    else {
        addInvent.quantity = addInvent.products.find(obj => obj.product === addInvent.productupdate).quantity + parseInt(qty);
        // addInvent.quantity = adInvent.quantity + qty;
        // console.log("addInvent.quantity type: " + typeof(addInvent.quantity));
        // console.log("qty type: " + typeof(qty));
        addInvent.back = addInvent.products.find(obj => obj.product === addInvent.productupdate).backorder;
        if (addInvent.back === null) addInvent.back = 0;
        if (parseInt(qty) !== addInvent.back) {
            inquirer
                .prompt([
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
                .then (answers => {
                    if (answers.checkqty === "No") {
                        console.log("\n\nPlease re-enter the correct number of units to add to inventory for " + addInvent.productupdate + ".")
                        howMany();
                    }
                    else {
                        backOrder(qty);
                        // console.log("")
                    }
                })
        }
        else {
            addInvent.back = parseInt(addInvent.back - qty);
            addInventory();
        }
    }      
}

function howMany() {
    inquirer
        .prompt ([
            {
                name:"addinventqty",
                message: "\n\nHow many additional units do you wish to add?"
            }
        ])
        .then (answers => {
            checkValidNo(answers.addinventqty);
        })           
} 
    

function whichProduct() {
    inquirer
        .prompt ([
            {
                type: "list",
                name: "addInventProd",
                message: "\n\nWhich product would you like to add more inventory to?",
                choices: addInvent.productnames,
                default: addInvent.productnames[0]
            }
        ])
        .then (answers => {
            addInvent.productupdate = answers.addInventProd;
            howMany();
        })
}


function prepInvent() {
    connection.query("SELECT productname, stockqty, backorder FROM products",
    function(err, rows) {
        if (err) throw err;
        addInvent.products = [];
        rows.forEach(element => {
            addInvent.products.push({product: element.productname,
                                    quantity: element.stockqty,
                                    backorder: element.backorder
                                    })
        });
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
        .then (answers => {
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
                addProduct();
            }
        })
}

displayOptions();