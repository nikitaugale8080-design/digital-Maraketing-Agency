const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",          // XAMPP मध्ये blank असेल
  database: "nexora_digital"
});

connection.connect((err) => {
  if (err) {
    console.log("Database not connected: ", err);
  } else {
    console.log("Database connected successfully");
  }
});

module.exports = connection;
