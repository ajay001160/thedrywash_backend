import mongoose from "mongoose";


const serviceItem=mongoose.Schema({
  serviceId:{
    type:mongoose.Schema.Types.ObjectId,
    required:true
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
  },
  serviceId:{
    type:mongoose.Types.ObjectId,
    ref:'service',
  }
},{timestamps:true});

export default mongoose.model("serviceitem",serviceItem);