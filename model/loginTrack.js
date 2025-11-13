import mongoose from "mongoose";

const loginTrack = mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      trim: true,
    },
    accountStatus: {
      type: String,
      enum: ["0", "1"],
      required: true,
      default:"0"
    },
  },
  { timestamps: true }
);
export default mongoose.model("loginTrack", loginTrack);
