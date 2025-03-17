import express from "express";
const mysql = require("mysql");
const { exec } = require("child_process");

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/redirect", (req, res) => {
  res.redirect(`http://${req.hostname}:3000${req.url}`);
});

app.get("/error", (req, res) => {
  throw new Error("Something broke!");
});

app.get("/payments", (req, res) => {
  const STRIPE_API_KEY = "sk_live_fakestripeapikeyleaked12"
  res.status(200).send(STRIPE_API_KEY)
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!", err);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "users_db",
});

// 🚨 SQL Injection Vulnerability (OWASP A03:2021)
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // 🚨 User input is concatenated directly into SQL query
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.query(query, (err, results) => {
        if (err) return res.status(500).send("Database error");
        if (results.length > 0) {
            res.send("Login successful");
        } else {
            res.send("Invalid credentials");
        }
    });
});

// 🚨 Command Injection Vulnerability (OWASP A07:2021)
app.get("/execute", (req, res) => {
    const command = req.query.cmd;

    // 🚨 Unvalidated user input directly passed to `exec()`
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Error: ${error.message}`);
        }
        res.send(stdout);
    });
});

// 🚨 XSS Vulnerability (OWASP A07:2021)
app.get("/xss", (req, res) => {
    const message = req.query.message;

    // 🚨 User input directly injected into HTML
    res.send(`<h1>${message}</h1>`);
});
