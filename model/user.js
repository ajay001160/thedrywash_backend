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
      unique:true 
    },
    email: {
      type: String,
      require: true,
      trim: true,
    },
    address: {
      flateNo: { type: String, required: true, trim: true },
      floor: { type: String, trim: true },
      sector: { type: String, required: true, trim: true },
      locality: { type: String, required: true, trim: true },
    },

    role: {
      type: String,
      enum: ["user", "partner", "subAdmin", "Admin"],
      required: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model("user", userSchema);
