const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "nexora_secret_key",
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.admin = req.session.admin || false;
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const webRoutes = require("./routes/webRoutes");
app.use("/", webRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
