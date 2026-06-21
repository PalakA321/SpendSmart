const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

// GET ALL
router.get("/", async (req, res) => {
  try {
    const data = await Transaction.find().sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADD
router.post("/", async (req, res) => {
  try {
    const { title, amount, category, type } = req.body;

    if (!title || amount === undefined || !category || !type) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const newTx = await Transaction.create({
      title,
      amount,
      category,
      type,
    });

    res.json({ success: true, data: newTx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SUMMARY
router.get("/summary", async (req, res) => {
  try {
    const tx = await Transaction.find();

    let income = 0;
    let expense = 0;

    tx.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });

    res.json({
      success: true,
      data: {
        income,
        expense,
        balance: income - expense,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;