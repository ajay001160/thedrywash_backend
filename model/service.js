import mongoose from "mongoose";

const serviceSchema = mongoose.Schema({
  service: {
    type: String,
    required: true,
    trim: true,
  },
  serviceItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Serviceitem",
    },
  ],
},{timestamps:true});

export default mongoose.model("service", serviceSchema);
