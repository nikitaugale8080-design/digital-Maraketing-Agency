const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "bom2ciydnbb9rhaf7nuv-mysql.services.clever-cloud.com",
  user: "uxueh5u0hqvpi3i6",
  password: "MRd6NxUwdj78Mvd8BoND",          // XAMPP मध्ये blank असेल
  database: "bom2ciydnbb9rhaf7nuv"
});

connection.connect((err) => {
  if (err) {
    console.log("Database not connected: ", err);
  } else {
    console.log("Database connected successfully");
  }
});

module.exports = connection;
