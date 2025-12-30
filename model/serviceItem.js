import mongoose from "mongoose";


const serviceItem=mongoose.Schema({
  serviceId:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
    ref:'service',
  },
  item:{
    type:String,
    trim:true,
    required:true
  },
  price:{
    type:String,
    trim:true,
    required:true
  }
},{timestamps:true});

export default mongoose.model("serviceitem",serviceItem);