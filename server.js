const express = require("express");
const sequelize = require("./database");
const Customer = require("./models/Customer");

const app = express();
const HOST = "127.0.0.1";
const PORT = 3000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

app.use(express.json());

// Register a new customer.
app.post("/customers", async (req, res) => {
  const { name, email } = req.body ?? {};
  if (typeof name !== "string" || typeof email !== "string") {
    return res.status(400).json({ error: "Name and email must be strings." });
  }

  // Validate the same trimmed values that will be stored.
  const customerName = name.trim();
  const customerEmail = email.trim();
  if (customerName.length === 0 || customerName.length > 100) {
    return res.status(400).json({ error: "Name must be 1–100 characters." });
  }
  if (customerEmail.length > 254 || !EMAIL_PATTERN.test(customerEmail)) {
    return res.status(400).json({ error: "Enter a valid email of up to 254 characters." });
  }

  try {
    const customer = await Customer.create({
      name: customerName,
      email: customerEmail,
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer." });
  }
});

// Get all registered customers.
app.get("/customers", async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers." });
  }
});

// Handle JSON parser errors without returning the parser's details.
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body." });
  }
  next(error);
});

// Connect to the database before starting Express.
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    await sequelize.sync();
    console.log("Database tables synchronized.");

    app.listen(PORT, HOST, (error) => {
      if (error) {
        console.error("Unable to listen:", error);
        process.exitCode = 1;
        return;
      }
      console.log(`Server running at http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start the server:", error);
    process.exitCode = 1;
  }
}

startServer();
