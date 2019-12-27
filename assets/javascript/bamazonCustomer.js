let inquirer = require("inquirer");
let mySQL = require("mysql");

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
        console.log("MySQL connection closed.")
        //end connection to MySQL
    })
}

function ohYouLegend(orderQuants, orderData, dbData) {
    if (orderQuants.buy === "Order" || orderQuants.buy === "Order items in stock only") {
        //if the order quantity exceeds the stock but the user has driven execution to this location then they  
        //have opted to just purchase what is available in stock so the orderData variable must be adjusted
        if (orderData[1] > dbData[0].stockqty) {
            orderData[1] = dbData[0].stockqty;
        }
        let qtyRemain = parseInt(dbData[0].stockqty - orderData[1])
        connection.query("UPDATE products SET stockqty = ? WHERE visproductID = ?", [qtyRemain, orderData[0]], 
            function(error, results) {
                if (error) throw error;
                connection.query("SELECT departmentname, productname FROM products WHERE visproductID = ?", [orderData[0]],
                    function(error, rows, fields) {
                        if (error) throw error;
                        console.log(rows);
                        console.log("Congratulations!!! Your order has been processed, you will shortly receive " + orderData[1] + 
                            " x " + rows[0].departmentname + " " + rows[0].productname + ".")
                })
                //console.log(results);
            endConn();
        })
    }
    else { //case for back order scenario where response is "Order all items requested"
        let qtyBackOrder = 0;
        connection.query("SELECT backorder FROM products WHERE visproductID = ?", [orderData[0]], 
            function(error, rows, fields) {
            console.log(qtyBackOrder)
            console.log("Backorder value: " + rows);
            console.log("Backorder value: " + rows[0].backorder);
            //output from queries to the database are of the form [ RowDataPacket { backorder: 0} ]
            if (rows[0].backorder === null) {
                rows[0].backorder = 0;
                console.log("dbData[0].backorder: " + rows[0].backorder);
                console.log("orderData[1]: " + orderData[1]);
                console.log("dbData[0].stockqty: " + dbData[0].stockqty);
                
            }
            qtyBackOrder = parseInt(orderData[1] + rows[0].backorder - dbData[0].stockqty);
            console.log("qtyBackOrder: " + qtyBackOrder);

        })
        console.log("qtyBackOrder: " + qtyBackOrder);
        connection.query("UPDATE products SET stockqty = 0, backorder = ? WHERE visproductID = ?", [qtyBackOrder, orderData[0]],
            function(error, results) {
                if (error) throw error;
                console.log(results);
                endConn();
        })
    }
   
}

function partAvail(orderData, stockData) {
    inquirer
        .prompt([
            {
                type: "list",
                name: "buy",
                message: "\n\nWe can only supply " + stockData[0].stockqty + " now with " +
                    parseInt(orderData[1] - stockData[0].stockqty) + " on back order.\nThe " +
                    "price for currently stocked items is $" + parseInt(stockData[0].stockqty * stockData[0].price) +
                    ".00 with $" + parseInt((orderData[1] - stockData[0].stockqty) * stockData[0].price) + ".00 due when " +
                    "you receive back ordered items. How do you wish to proceed?",
                choices: ["Order items in stock only", "Order all items requested", "Cancel order"],
                default: "Order items in stock only"
            }
        ])
        .then (answers => {
            console.log(answers);
            if (answers.buy === "Order items in stock only" || answers.buy === "Order all items requested") {
                ohYouLegend(answers, orderData, stockData);
            }
            else {
                qnAreYouLame();
            }
        })
}

function noneAvail(orderData, stockData) {
    inquirer
        .prompt([
            {
                type:"list",
                name: "buy",
                message: "\n\nThere are currently none of those products in stock and " + orderData[1] +
                    " on back order.\nThe price for back ordered items is $" + 
                    parseInt(orderData[1] * stockData[0].price) + ".00 due when you receive back \nordered items. " +
                    "How do you wish to proceed?",
                choices: ["Order all items requested", "Cancel order" ],
                default: "Order all items requested"
            }
        ])
        .then (answers => {
            console.log(answers);
            if (answers.buy === "Order all items requested") {
                ohYouLegend(answers, orderData, stockData);
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
                name:"\n\nIs there another product you might be interested in?",
                choices: ["Yes", "No"],
                default: "Yes"
            }
        ])
        .then (answers => {
            console.log(answers);
            if (answers === "Yes") {
                showProducts();
            }
            else {
                console.log("\n\nCome and see us again when you are ready to go " +
                    "paddling because right now you're being a whiny little bitch.")
                endConn();
            }
        })
}

function allInStock(orderData, stockData) {
    inquirer
        .prompt([
            {
                type: "list",
                name: "buy",
                message: "\n\nYour order can be filled now for $" + orderData[1] * stockData[0].price + 
                    ". How do you wish to proceed?",
                choices: ["Order", "Cancel order"],
                default: "Order"
            }
        ])
        .then (answers => {
            if (answers.buy === "Order") {
                ohYouLegend(answers, orderData, stockData);
            }
            else {
                qnAreYouLame();
            }
        })
}

function checkDB(orderData) {
    connection.query("SELECT price, stockqty FROM products WHERE visproductID = ?", orderData[0], function (err, rows, fields) {
        if(err) throw err;
        //output from queries to the database are of the form [ RowDataPacket { price: 1200, stockqty: 0 } ]
        //stock is available to cover the order
        if (orderData[1] <= rows[0].stockqty) {
            allInStock(orderData, rows);  
        }
        //there is no stock left
        else if (rows[0].stockqty === 0) {
            noneAvail(orderData, rows);
        }  
        else {//order exceeds current amount of stock and stock is not zero
            partAvail(orderData, rows);
        }
    })
}

function whatBoat(boatID, purpose, answer1, orderData=[0,1]) {
    console.log(boatID);
    console.log(typeof(parseInt(boatID)));
    connection.query("SELECT departmentname, productname FROM products WHERE visproductID = ?", [parseInt(boatID)],
        function(error, rows, fields) {
            if (error) throw error;
            if (purpose === "purch") {  //for querying how many of a particular boat are to be purchased
                inquirer
                .prompt([
                    {
                        name: "quantity",
                        //output from queries to the database are of the form [ RowDataPacket { departmentname: 'Pyranha', productname: 'Nano M' } ]
                        message: "\n\nHow many " + rows[0].departmentname + " " + rows[0].productname + "s would you like to buy: "
                    }
                ])
                .then(answer2 => {
                    //output from the inquirer responses are of the form { quantity: '2' }
                    let answers = [answer1.product, answer2.quantity];
                    checkDB(answers);
                })
                console.log("whatBoat department: " + rows[0].departmentname);
                console.log("whatBoat product: " + rows[0].productname);
            }
            else {  //for advising the order for the particular boat has been successful
                //output from queries to the database are of the form [ RowDataPacket { departmentname: 'Pyranha', productname: 'Nano M' } ]
                console.log("Congratulations your order has been processed, you will shortly receive " + orderData[1] + 
                    " x " + rows[0].departmentname + " " + rows[0].productname)
            }
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
            connection.query("SELECT departmentname, productname FROM products WHERE visproductID = ?", [answer1.product],
            function(error, rows, fields) {
                if (error) throw error;
                inquirer
                    .prompt([
                        {
                            name: "quantity",
                            //output from queries to the database are of the form [ RowDataPacket { departmentname: 'Pyranha', productname: 'Nano M' } ]
                            message: "\n\nHow many " + rows[0].departmentname + " " + rows[0].productname + "s would you like to buy: "
                        }
                    ])
                    .then(answer2 => {
                        //output from the inquirer responses are of the form { quantity: '2' }
                        let answers = [answer1.product, answer2.quantity];
                        checkDB(answers);
                    })
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
            },
        ])
        .then(answers => {
            console.info("Answer:", answers.purchaseProduct);
            if (answers.purchaseProduct === "yes") {
                purchProd();
            }
            else {
                console.log("\n\nCome and see us again when you are ready to go " +
                    "paddling because right now you're being a whiny little bitch.")
                endConn();
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
    dbConnection();
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

showProducts();

