//@ts-check

let inquirer = require("inquirer");
let mySQL = require("mysql");
let purchaseObject = {};

let connection = mySQL.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
})

function endConn(nature) {
    if (nature === "wimp") {
        console.log("\n\nCome and see us again when you are ready to go " +
        "paddling\nbecause right now you're being a whiny little bitch.")
    }
    else{
        console.log("\n\nYou are officialy a legend enjoy your new paddling tool.")
    }
    connection.end(function(err){
        if (err) throw err;
        console.log("\n\nMySQL connection closed.")
        //end connection to MySQL
    })
}

function updateBackOrd() {
    connection.query("UPDATE products SET stockqty = 0, backorder = ? WHERE visproductID = ?", [purchaseObject.totebo, purchaseObject.prodID],
        function(error, results) {
            if (error) throw error;
        })
}

function orderComplete() {
   if (purchaseObject.direct === "Order" || purchaseObject.direct === "Order items in stock only") {
        if (purchaseObject.qty === 1) {
        console.log("\n\nCongratulations!!! Your order has been processed, you will shortly receive " + purchaseObject.qty + 
        " x " + purchaseObject.dept + " " + purchaseObject.prod + ".");
        }
        else {
            console.log("\n\nCongratulations!!! Your order has been processed, you will shortly receive " + purchaseObject.qty + 
        " x " + purchaseObject.dept + " " + purchaseObject.prod + "s.");
        }
    }
    else if (purchaseObject.inStock === 0) {
        if (purchaseObject.qty === 1) {
            console.log("\n\nCongratulations!!! Your order has been processed, your " + purchaseObject.qty + 
            " x " + purchaseObject.dept + " " + purchaseObject.prod + " are on back order for you.")
        }
        else {
            console.log("\n\nCongratulations!!! Your order has been processed, your " + purchaseObject.qty + 
            " x " + purchaseObject.dept + " " + purchaseObject.prod + "s are on back order for you.")
        }
    }
    else {
        if (purchaseObject.qty === 1) {
            console.log("\n\nCongratulations!!! Your order has been processed, you will shortly receive " + purchaseObject.inStock + 
            " x " + purchaseObject.dept + " " + purchaseObject.prod + ". " + purchaseObject.persbo + " additional " + 
            purchaseObject.dept + " " + purchaseObject.prod + " are on back order for you.")
        }
        else {
            console.log("\n\nCongratulations!!! Your order has been processed, you will shortly receive " + purchaseObject.inStock + 
            " x " + purchaseObject.dept + " " + purchaseObject.prod + "s. " + purchaseObject.persbo + " additional " + 
            purchaseObject.dept + " " + purchaseObject.prod + "s are on back order for you.")
        }
    }  
}

function ohYouLegend() {
    // console.log("start of ohYouLegend orderQuants: " + orderQuants.buy);
    if (purchaseObject.direct === "Order" || purchaseObject.direct === "Order items in stock only") {
        //if the order quantity exceeds the stock but the user has driven execution to this location then they  
        //have opted to just purchase what is available in stock so the orderData variable must be adjusted
        if (purchaseObject.qty > purchaseObject.inStock) {
            purchaseObject.qty = purchaseObject.inStock;
        }
        purchaseObject.remStk = parseInt(purchaseObject.inStock - purchaseObject.qty);
        connection.query("UPDATE products SET stockqty = ? WHERE visproductID = ?", [purchaseObject.remStk, purchaseObject.prodID], 
            function(error, results) {
                if (error) throw error;
                orderComplete();
                endConn("legend");
        })
    }
    else { //case for back order scenario where response is "Order all items requested"
        purchaseObject.persbo = parseInt(purchaseObject.qty - purchaseObject.inStock);
        if (purchaseObject.persbo >= purchaseObject.back) {
            purchaseObject.totebo = (purchaseObject.persbo - purchaseObject.back) + purchaseObject.back;
        }
        else purchaseObject.totebo = purchaseObject.back
        updateBackOrd();
        orderComplete();
        endConn("legend");
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
                    "price for currently stocked items is $" + parseInt(purchaseObject.inStock * purchaseObject.price) +
                    ".00 with $" + parseInt((purchaseObject.qty - purchaseObject.inStock) * purchaseObject.price) + ".00 " + 
                    "due when you receive your back ordered items. \nHow do you wish to proceed?",
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
                qnAreYouLame();
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
                    " on back order.\nThe price for your back ordered items is $" + 
                    parseInt(purchaseObject.qty * purchaseObject.price) + ".00 due when you receive back \nthem. " +
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
                qnAreYouLame();
            }
        })
}

function qnAreYouLame() {
    inquirer
        .prompt([
            {
                type: "list",
                name: "lameorno",
                message:"\n\nIs there another product you might be interested in?",
                choices: ["Yes", "No"],
                default: "Yes"
            }
        ])
        .then (answers => {
            purchaseObject.direct = answers.lameorno;
            if (purchaseObject.direct === "Yes") {
                showProducts();
            }
            else {
                endConn("wimp");
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
                qnAreYouLame();
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
    console.log(data);
    purchaseObject.price = rows[0].price;
    purchaseObject.inStock = rows[0].stockqty;
    purchaseObject.dept = rows[0].departmentname;
    purchaseObject.prod = rows[0].productname;
    if (rows[0].productsales !== null) {
        purchaseObject.prodSales = rows[0].productsales;
    }
    else {
        purchaseObject.prodSales = 0;
    }
    if (rows[0].backorder !== null) {
        purchaseObject.back = rows[0].backorder;
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
                        if (isNaN(value)) {
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
                message: "\n\nNominate which product you wish to buy by productID: "
            }
        ])
        .then(answer1 => {
            purchaseObject.prodID = answer1.product;
            connection.query("SELECT price, stockqty, backorder, departmentname, productname, productsales FROM products WHERE visproductID = ?", [purchaseObject.prodID],
            function(error, rows, fields) {
                if (error) throw error;
                if (!rows.length) {  //check for the case where no results were found from the nominated productID
                    inquirer
                        .prompt([
                            {
                                type: "list",
                                name: "noResults",
                                message: "\n\nYou have selected a productID of " + purchaseObject.prodID + " which has no matching record.\nDo you wish to try again?",
                                choices: ["Yes", "No"],
                                default: "Yes"
                            }
                        ])
                        .then(answer => {
                            if (answer.noResults === "Yes") showProducts();
                            else {
                                endConn("wimp");
                            }
                            
                        })
                }
                else {  //productID yielded a matching record in the database
                    assignData(rows)
                    // purchaseObject.price = rows[0].price;
                    // purchaseObject.inStock = rows[0].stockqty;
                    // purchaseObject.dept = rows[0].departmentname;
                    // purchaseObject.prod = rows[0].productname;
                    // if (rows[0].productsales !== null) {
                    //     purchaseObject.prodSales = rows[0].productsales;
                    // }
                    // else {
                    //     purchaseObject.prodSales = 0;
                    // }
                    // if (rows[0].backorder !== null) {
                    //     purchaseObject.back = rows[0].backorder;
                    // }
                    // else {
                    //     purchaseObject.back = 0; 
                    // }
                    // inquirer
                    //     .prompt([
                    //         {
                    //             name: "quantity",
                    //             //output from queries to the database are of the form [ RowDataPacket { departmentname: 'Pyranha', productname: 'Nano M' } ]
                    //             message: "\n\nHow many " + purchaseObject.dept + " " + purchaseObject.prod + "s would you like to buy: "
                    //         }
                    //     ])
                    //     .then(answer2 => {
                    //         //output from the inquirer responses are of the form { quantity: '2' }
                    //         purchaseObject.qty = answer2.quantity;
                    //         // let answers = [answer1.product, answer2.quantity];
                    //         checkDB();
                    //     })
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
            console.info("Answer:", answers.purchaseProduct);
            if (answers.purchaseProduct === "yes") {
                purchProd();
            }
            else {
                endConn("wimp");
            }
        });
}

function dbConnection() {
    connection.connect(function(err) {
        if (err) throw err;
        console.log("Connected as id " + connection.threadId);
    })
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

dbConnection();
showProducts();

