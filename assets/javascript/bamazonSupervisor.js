//@ts-check

let inquirer = require("inquirer");
let mySQL = require("mysql");
let newDept = [];

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
                message: "\n\nWhat would you like to do now?\n\n",
                choices: ["Go back to the main menu", "Exit entirely"],
                default: "Go back to the main menu"
            },
        ])
        .then( answers => {
            if (answers.nextStep === "Go back to the main menu") displayOptions();
            else endConn();
        })
}

function addDepartment() {
    //create the new record by inserting the compulsory fields 
    connection.query("INSERT INTO departments (departmentname, overheadcosts) " + 
        "VALUES ('" +
            newDept[0] + 
            "', '" + newDept[1] +  ")", function(err, rows) {
            if (err) throw err;
    })
}

function displaySales() {
    //display all products
    connection.query("SELECT " +
                          "departmentID " +
                          ",departmentname " +
                          ",SUM(overheadcosts) " +
                          ",SUM(productsales) " + 
                          ",SUM(productsales) - SUM(overheadcosts) AS totalprofit " +
                    "FROM departments AS S1 " +
                    "INNER JOIN products AS S2 " +
                    "ON S1.departmentname = S2.departmentname " + 
                    "GROUP BY departmentID, S1.departmentname " + 
                    "ORDER BY departmentname",
        function(err, rows, fields) {
            if (err) throw err;
            console.table(rows);
            nextTask();
    })
}

function displayOptions() {
    //ask the manager what they would like to do
    inquirer
        .prompt([
            {
                type: "list",
                name: "supvOptions",
                message: "\nWhich of the following would you like to do?",
                choices: ["View product sales by department"
                         ,"Create new department"],
                default: "View product sales by department"
            }
        ])
        .then(answers => {
            if (answers.supvOptions === "View product sales by department") {
                displaySales();
            }
            else {
                addDepartment();
            }
        })
}

displayOptions();