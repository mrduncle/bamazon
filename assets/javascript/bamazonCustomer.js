//@ts-check

let inquirer = require("inquirer");
let mySQL = require("mysql");
let purchaseObject = {};
let nature;

let connection = mySQL.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
})

function endConn() {
    if (nature === "wimp") {
        console.log("\n\nCome and see us again when you are ready to go " +
        "paddling\nbecause right now you're being a whiny little bitch.")
    }
    else{
        console.log("\n\nYou are officially a Legend!! Enjoy your new paddling tool.")
    }
    connection.end(function(err){
        if (err) throw err;
        console.log("\n\nMySQL connection closed.")
        //end connection to MySQL
    })
}

function orderComplete() {
    //order filled now
   if (purchaseObject.direct === "Order" || purchaseObject.direct === "Order items in stock only") {
        if (purchaseObject.qty === 1) { //single item purchased
        console.log("\n\nCongratulations!!! Your order has been processed, you will shortly receive " + purchaseObject.qty + 
        " x " + purchaseObject.dept + " " + purchaseObject.prod + ".");
        }
        else { //multiple items purchased
            console.log("\n\nCongratulations!!! Your order has been processed, you will shortly receive " + purchaseObject.qty + 
        " x " + purchaseObject.dept + " " + purchaseObject.prod + "s.");
        }
    }
    //order must be filled completely through a back order
    else if (purchaseObject.inStock === 0) {
        if (purchaseObject.qty === 1) { //single item purchased
            console.log("\n\nCongratulations!!! Your order has been processed, your " + purchaseObject.qty + 
            " x " + purchaseObject.dept + " " + purchaseObject.prod + " are on back order for you.")
        }
        else { //multiple items purchased
            console.log("\n\nCongratulations!!! Your order has been processed, your " + purchaseObject.qty + 
            " x " + purchaseObject.dept + " " + purchaseObject.prod + "s are on back order for you.")
        }
    }
    //order has a back order component
    else { //single item purchased
        if (purchaseObject.qty === 1) {
            console.log("\n\nCongratulations!!! Your order has been processed, you will shortly receive " + purchaseObject.inStock + 
            " x " + purchaseObject.dept + " " + purchaseObject.prod + ". " + purchaseObject.persbo + " additional " + 
            purchaseObject.dept + " " + purchaseObject.prod + " are on back order for you.")
        }
        else { //multiple items purchased
            console.log("\n\nCongratulations!!! Your order has been processed, you will shortly receive " + purchaseObject.inStock + 
            " x " + purchaseObject.dept + " " + purchaseObject.prod + "s. " + purchaseObject.persbo + " additional " + 
            purchaseObject.dept + " " + purchaseObject.prod + "s are on back order for you.")
        }
    }
    nature = "Legend"
    nextTask(nature);  
}

function updateBackOrd() {
    let toteSales = parseInt((purchaseObject.qty * purchaseObject.price) + purchaseObject.prodSales);
    connection.query("UPDATE products " +
                     "SET stockqty = 0 " +
                     ",backorder = ? " + 
                     ",productsales = ? " + 
                     " WHERE visproductID = ?", [purchaseObject.totebo, toteSales, purchaseObject.prodID],
        function(error, results) {
            if (error) throw error;
            orderComplete();
        })
}

function ohYouLegend() {
    if (purchaseObject.direct === "Order" || purchaseObject.direct === "Order items in stock only") {
        //if the order quantity exceeds the stock but the user has driven execution to this location then they  
        //have opted to just purchase what is available in stock so the orderData variable must be adjusted
        if (purchaseObject.qty > purchaseObject.inStock) {
            purchaseObject.qty = purchaseObject.inStock;
        }
        purchaseObject.remStk = parseInt(purchaseObject.inStock - purchaseObject.qty);
        connection.query("UPDATE products " +
                         "SET " +
                             "stockqty = ? " +
                             ",productsales = " + parseInt(purchaseObject.qty * purchaseObject.price + purchaseObject.prodSales) + 
                             " WHERE visproductID = ?"
                             , [purchaseObject.remStk, purchaseObject.prodID], 
            function(error, results) {
                if (error) throw error;
                orderComplete();
        })
    }
    else { //case for back order scenario where response is "Order all items requested"
        purchaseObject.persbo = parseInt(purchaseObject.qty - purchaseObject.inStock);
        //set the total back order amount to be existing back order plus extras from the current order
        purchaseObject.totebo = purchaseObject.persbo + purchaseObject.back;
        updateBackOrd();
    }  
}

function partAvail() {
    inquirer
        .prompt([
            {
                type: "list",
                name: "buy",
                message: "\n\nThere are " + purchaseObject.inStock + " in stock now with " +
                    "an existing back order of " + purchaseObject.back + ".\nThe " +
                    "price for the entire order is $" + parseInt(purchaseObject.qty * purchaseObject.price) +
                    ".00. The price for the items in stock is $" + parseInt(purchaseObject.inStock * purchaseObject.price) +
                    ".\nHow do you wish to proceed?",
                choices: ["Order items in stock only", "Order all items requested", "Cancel order"],
                default: "Order items in stock only"
            }
        ])
        .then (answers => {
            purchaseObject.direct = answers.buy
            if (purchaseObject.direct === "Order items in stock only" || purchaseObject.direct === "Order all items requested") {
                ohYouLegend();
            }
            else {
                nextTask();
            }
        })
}

function noneAvail() {
    inquirer
        .prompt([
            {
                type:"list",
                name: "buy",
                message: "\n\nThere are currently none of those products in stock and " + purchaseObject.back +
                    " on back order.\nThe price to proceed with your order is $" + 
                    parseInt(purchaseObject.qty * purchaseObject.price) + ".00. " +
                    "How do you wish to proceed?",
                choices: ["Order all items requested", "Cancel order" ],
                default: "Order all items requested"
            }
        ])
        .then (answers => {
            purchaseObject.direct = answers.buy
            if (purchaseObject.direct === "Order all items requested") {
                ohYouLegend();
            }
            else {
                nextTask();
            }
        })
}

function nextTask() {
    inquirer
        .prompt ([
            {
                type: "list",
                name: "nextStep",
                message: "\n\nIs there another product you might be interested in?\n\n",
                choices: ["Yes", "No"],
                default: "Yes"
            },
        ])
        .then(answers => {
            purchaseObject.direct = answers.nextStep;
            if (purchaseObject.direct === "Yes") {
                showProducts();
            }
            else {
                if (nature !== "Legend") nature = "wimp";
                endConn();
            }
        })
}

function allInStock() {
    inquirer
        .prompt([
            {
                type: "list",
                name: "buy",
                message: "\n\nYour order can be filled now for $" + purchaseObject.qty * purchaseObject.price + 
                    ". How do you wish to proceed?",
                choices: ["Order", "Cancel order"],
                default: "Order"
            }
        ])
        .then (answers => {
            purchaseObject.direct = answers.buy;
            if (purchaseObject.direct === "Order") {
                ohYouLegend();
            }
            else {
                if (nature !== "Legend") nature = "wimp";
                nextTask();
            }
        })
}

function checkDB() {
    if (purchaseObject.qty <= purchaseObject.inStock) {
        allInStock();  
    }
    //there is no stock left
    else if (purchaseObject.inStock === 0) {
        noneAvail();
    }  
    else {//order exceeds current amount of stock and stock is not zero
        partAvail();
    }
}

function assignData(data) {
    purchaseObject.price = data[0].price;
    purchaseObject.inStock = data[0].stockqty;
    purchaseObject.dept = data[0].departmentname;
    purchaseObject.prod = data[0].productname;
    if (data[0].productsales !== null) {
        purchaseObject.prodSales = data[0].productsales;
    }
    else {
        purchaseObject.prodSales = 0;
    }
    if (data[0].backorder !== null) {
        purchaseObject.back = data[0].backorder;
    }
    else {
        purchaseObject.back = 0; 
    }
    purchaseObject.qty = "";
        inquirer
            .prompt([
                {
                    name: "quantity",
                    //output from queries to the database are of the form [ RowDataPacket { departmentname: 'Pyranha', productname: 'Nano M' } ]
                    message: "\n\nHow many " + purchaseObject.dept + " " + purchaseObject.prod + "s would you like to buy: ",
                    validate: function (value) {
                        if (isNaN(value) || value === "" || parseInt(value) === 0) {
                            return "Please enter a valid number for the quantity you wish to buy.";
                        }
                        else {
                            return true;
                        }
                    } 
                }
            ])
            .then(answers => {
                //output from the inquirer responses are of the form { quantity: '2' }
                purchaseObject.qty = answers.quantity;
                checkDB();
            })
    }
    

function purchProd() {
    //function queries the user about which product they are interested in and how many they are after
    inquirer
        .prompt([
            {
                name: "product",
                message: "\n\nNominate which product you wish to buy by productID: ",
                validate: function (value) {
                    if (isNaN(value) || value === "") {
                        return "Please enter a valid ID for the product you wish to buy.";
                    }
                    else {
                        return true;
                    }
                }
            }
        ])
        .then(answer1 => {
            purchaseObject.prodID = answer1.product;
            connection.query("SELECT price, stockqty, backorder, departmentname, productname, " +
            "productsales FROM products WHERE visproductID = ?", [purchaseObject.prodID],
            function(error, rows, fields) {
                if (error) throw error;
                if (!rows.length) {  //check for the case where no results were found from the nominated productID
                    inquirer
                        .prompt([
                            {
                                type: "list",
                                name: "noResults",
                                message: "\n\nYou have selected a productID of " + purchaseObject.prodID + 
                                    " which has no matching record.\nDo you wish to try again?",
                                choices: ["Yes", "No"],
                                default: "Yes"
                            }
                        ])
                        .then(answer => {
                            if (answer.noResults === "Yes") showProducts();
                            else {
                                nextTask();
                            }
                            
                        })
                }
                else {  //productID yielded a matching record in the database
                    assignData(rows)
                }
            })
        })     
}

function queryPurchase() {
    inquirer
        .prompt([
            {
                type: "list",
                name: "purchaseProduct",
                message: "\nWould you like to purchase any of the products displayed?",
                choices: ["yes", "no"],
                default: "yes"
            }
        ])
        .then(answers => {
            if (answers.purchaseProduct === "yes") {
                purchProd();
            }
            else {
                if (nature !== "Legend") nature = "wimp";
                endConn();
            }
        });
}

function showProducts() {
    purchaseObject = {};
    connection.query("SELECT visproductID as productID, productname, departmentname, price, " +
        "stockqty FROM products", function (error, rows, fields) {
        if(error) throw error;
        console.log("\n\n=========================================================\n" + 
            "Please see below list of products available for purchase.\n" + 
            "=========================================================");
        console.table(rows);
        queryPurchase();
    })
}

function dbConnection() {
    connection.connect(function(err) {
        if (err) throw err;
    })
}

dbConnection();
showProducts();

