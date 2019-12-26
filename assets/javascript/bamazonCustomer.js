let inquirer = require("inquirer");
let mySQL = require("mysql");

let connection = mySQL.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
})

connection.connect(function(err) {
    if (err) throw err;
    // console.log("Connected as id " + connection.threadId);
})

function endConn() {
    connection.end(function(err){
        if (err) throw err;
        console.log("MySQL connection closed.")
        //end connection to MySQL
    })
}

function updateDB(orderQuants, idQty, dbData) {
    console.log(orderQuants);
    if (orderQuants === "Cancel Order") {
        ;
    }
    else if (orderQuants === "Order" || orderQuants === "Order items in stock only") {
        let qtyRemain = parseInt(dbData[0].stockqty - idQty[1])
        connection.query("UPDATE products SET stockqty = ? WHERE productID = ?", [qtyRemain, idQty[0]], 
            function(error, results){
                if (error) throw error;
                console.log(results);
        })

    }
    else {
        let qtyBackOrder;
        connection.query("SELECT backorder FROM products WHERE productID = ?", [idQty[0]], 
            function(error, rows, fields) {
            if (rows[0].backorder === "NULL" || rows[0].backorder === "null") {
                rows[0].backorder = 0;
            }
            qtyBackOrder = parseInt((idQty[1] + rows[0].backorder - dbData[0].stockqty))
        })
        connection.query("UPDATE products SET stockqty = 0, backorder = ? WHERE productID = ?", [qtyBackOrder, idQty[0]],
            function(error, results) {
                if (error) throw error;
                console.log(results);
        })
    }
    endConn();
}

function checkDB(idQty) {
    connection.query("SELECT price, stockqty FROM products WHERE productID = ?", idQty[0], function (err, rows, fields){
        if(err) throw err;
        if (idQty[1] <= rows[0].stockqty) {
            inquirer
                .prompt([
                    {
                        type: "list",
                        name: "buy",
                        message: "\n\nYour order can be filled now for $" + idQty[1] * rows[0].price + 
                            ". How do you wish to proceed?",
                        choices: ["Order", "Cancel order"],
                        default: "Order"
                    }
                ])
                .then (answers => {
                    updateDB(answers, idQty, rows);
                })
        }
        else {
            console.log(rows[0].price);
            inquirer.prompt([
                {
                    type: "list",
                    name: "buy",
                    message: "\n\nWe can only supply " + rows[0].stockqty + " now with " +
                        parseInt(idQty[1] - rows[0].stockqty) + " on back order.\nThe " +
                        "cost for currently stocked items is " + parseInt(rows[0].stockqty * rows[0].price) +
                        " with " + parseInt((idQty[1] - rows[0].stockqty) * rows[0].price) + " due when " +
                         "you receive back ordered items. How do you wish to proceed?",
                    choices: ["Order items in stock only", "Order all items requested", "Cancel order"],
                    default: "Order items in stock only"
                }
            ])
            .then (answers => {
                updateDB(answers, idQty, rows);
            })
        }
    })
}

function purchProd() {
    inquirer
        .prompt([
            {
                name: "product",
                message: "\n\nNominate which product you wish to buy by ID: "
            }
            // {
            //     name: "quantity",
            //     message: "\n\nNominate how many of the product you want to buy: "
            // }
        ])
        .then(answer1 => {
            console.log(answer1)
            connection.query("SELECT departmentname, productname FROM products WHERE productID = ?", answer1.product, 
                function(error, rows, fields){
                if (error) throw error;
                console.log(rows);
                inquirer
                    .prompt([
                        {
                            name: "quantity",
                            message: "\n\nHow many " + rows[0].departmentname + " " + rows[0].productname + "s would you like to buy: "
                        }
                    ])
                    .then(answer2 => {
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
                console.log("\n\nCome and see us again when you are ready to go paddling.")
            }
        });
}

connection.query("SELECT * FROM products", function(error, rows, fields) {
    if(error) throw error;
    console.log("\n\n=========================================================\n" + 
        "Please see below list of products available for purchase.\n" + 
        "=========================================================");
    console.table(rows);
    queryPurchase();
})

