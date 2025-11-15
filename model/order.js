import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user", // optional but useful
    },
    orderId: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    number: {
      type: String,
      trim: true,
      required: true,
    },
    address: {
      flatNo: { type: String, trim: true, required: true },
      floor: { type: String, trim: true },
      sector: { type: String, trim: true, required: true },
      locality_society: { type: String, trim: true },
    },
    items: {
      type: Array,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "delivered", "cancelled"],
      default: "pending",
    },
    totalPrice: {
      type: String,
      required: true,
      trim: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deliveryTime: {
      type: String,
    },
    deliveredBy: {
      type: String,
      default: "none",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("order", orderSchema);
