const express = require("express");
const Supplier = require("../models/Supplier");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    let suppliers = await Supplier.find().sort("-createdAt");
    
    // Auto-seed dummy Indian suppliers if none exist
    if (suppliers.length === 0) {
      const dummyData = [
        { name: "Reliance Retail Distributors", address: "Mumbai, Maharashtra", contactNumber: "+91 9876543210", email: "contact@reliance.com", gstin: "27AADCR2321Q1ZV" },
        { name: "Tata Enterprises Logistics", address: "Pune, Maharashtra", contactNumber: "+91 9123456780", email: "supply@tata.com", gstin: "27AAACT2727Q1ZW" },
        { name: "Adani Wilmar Supplies", address: "Ahmedabad, Gujarat", contactNumber: "+91 9988776655", email: "info@adani.com", gstin: "24AAACA1234Q1ZX" },
        { name: "Flipkart Wholesale", address: "Bengaluru, Karnataka", contactNumber: "+91 8877665544", email: "vendor@flipkart.com", gstin: "29AAACF1234Q1ZY" },
        { name: "Udaan B2B", address: "Delhi", contactNumber: "+91 7766554433", email: "sales@udaan.com", gstin: "07AAACU1234Q1ZZ" }
      ];
      await Supplier.insertMany(dummyData);
      suppliers = await Supplier.find().sort("-createdAt");
    }
    
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: "Supplier deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
