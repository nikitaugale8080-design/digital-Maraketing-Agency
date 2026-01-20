const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "bitn4xysn9ci41i1kute-mysql.services.clever-cloud.com",
  user: "uznyf7pdc7jtdy1w",
  password: "eNzxTF9QghFReKmoGEGd",          // XAMPP मध्ये blank असेल
  database: "bitn4xysn9ci41i1kute"
});

connection.connect((err) => {
  if (err) {
    console.log("Database not connected: ", err);
  } else {
    console.log("Database connected successfully");
  }
});

module.exports = connection;
