import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      trim: true,
    },
    number: {
      type: String,
      require: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      require: true,
      trim: true,
    },
    gender: {
      type: String,
      required: false,
    },
    aternateNumber: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      flateNo: { type: String, required: true, trim: true },
      floor: { type: String, trim: true },
      society_locality: { type: String, trim: true, required: true },
      sector: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
    },

    role: {
      type: String,
      enum: ["user", "partner", "subAdmin", "admin"],
      required: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model("user", userSchema);
