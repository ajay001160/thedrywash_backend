import mongoose, { mongo } from "mongoose";


const cartSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    items: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "service",
        },
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "serviceitem",
        },
        quantity: {
          type: String,
          require: true,
        }
      }
    ],
    totalPrice:{
      type:String,
      trim:true
    },
    status:{
      type:String,
      enum:["0","1","2"],
      default:"0"
    }
  },
 
  { timestamps: true }
);
export default mongoose.model("cart",cartSchema);
