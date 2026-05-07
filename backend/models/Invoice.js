const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({

  invoiceNumber: String,
  customerName: String,
  supplierName: String,

  items: [
    {
      productName: String,
      quantity: Number,
      price: Number,
      total: Number
    }
  ],

  totalAmount: Number,

  startDate: Date,
  endDate: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Invoice", invoiceSchema);