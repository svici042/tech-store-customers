const express = require("express");
const sequelize = require("./database");
const Customer = require("./models/Customer");

const app = express();
const PORT = 3000;

app.use(express.json());

// Register a new customer.
app.post("/customers", async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check that both required fields contain text.
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        error: "Name and email are required.",
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      email: email.trim(),
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

// Connect to the database before starting Express.
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    await sequelize.sync();
    console.log("Database tables synchronized.");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start the server:", error);
    process.exitCode = 1;
  }
}

startServer();