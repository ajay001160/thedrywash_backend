import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
  number: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
    expires: 300,
  },
},{timestamps:true});
export default mongoose.model("otp", otpSchema);
