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
    connection.query("INSERT INTO departments " +
                    "(" + 
                          "departmentname" +
                          ", overheadcosts" +
                     ") " + 
                     "VALUES " +
                     "('" +
                           newDept[0] + 
                          "', " + newDept[1] +
                     ")", function(err, rows) {
            if (err) {
                throw err;
            }
            else {
                console.log("Your new department " + newDept[0] + " has been added.")
            }
            nextTask();
    })
}

function getDepartment() {
    inquirer
        .prompt ([
            {
                type: "input",
                name: "department",
                message: "\n\nPlease enter the name of the new department.",
                validate: function(value) {
                    if (value === "") {
                        return "Please enter a valid value.";
                    }
                    else return true;
                }
            },
            {
                type: "input",
                name: "overheads",
                message: "\n\nPlease enter the overheads for the department.",
                validate: function(value) {
                    if (value === "") {
                        return "Please enter a valid value.";
                    }
                    else return true;
                }
            }
        ])
        .then(answers => {
            //answers of the type {department: 'Riot', overheads: '10000'}
            newDept[0] = answers.department;
            newDept[1] = answers.overheads;
            addDepartment();
        })  
}

function displaySales() {
    //display all products
    connection.query("SELECT " +
                          "departmentID " +
                          ",S1.departmentname " +
                          ",overheadcosts " +
                          ",SUM(productsales) " + 
                          ",CASE WHEN SUM(productsales) IS NULL THEN -(overheadcosts) " +
                                "ELSE SUM(productsales) - overheadcosts " +
                           "END AS totalprofit " +
                    "FROM departments AS S1 " +
                    "LEFT JOIN products AS S2 " +
                    "ON S1.departmentname = S2.departmentname " + 
                    "GROUP BY departmentID, S1.departmentname, overheadcosts " + 
                    "ORDER BY S1.departmentname",
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
                getDepartment();
            }
        })
}

displayOptions();