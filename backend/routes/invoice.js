const express = require("express");
const Invoice = require("../models/Invoice");

const router = express.Router();

/* CREATE INVOICE */

router.post("/", async (req, res) => {
  try {

    const invoice = new Invoice(req.body);
    await invoice.save();

    res.json(invoice);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET ALL */

router.get("/", async (req, res) => {
  const query = {};
  if (req.query.supplierName) query.supplierName = req.query.supplierName;
  const invoices = await Invoice.find(query).sort("-createdAt");
  res.json(invoices);
});

/* GET SINGLE */

router.get("/:id", async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  res.json(invoice);
});

module.exports = router;