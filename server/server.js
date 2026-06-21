const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

console.log("SERVER STARTED");

// Routes
app.use("/api/transactions", transactionRoutes);

app.get("/", (req, res) => {
  res.send("SpendSmart Backend Running");
});

// SAFE DB CONNECTION
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.log("❌ MongoDB Error:", err.message);
  }
}

startServer();