import express from "express";
import dotenv from "dotenv";
dotenv.config();
import fileUpload from "express-fileupload"
import userRoute from "./route/user.js"
import subAdminRoute from "./route/subadmin.js";
import dbconnection from "./config/dbconnection.js";
import logger from "./utility/logger.js";
const app=express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use("/api/v1",userRoute,subAdminRoute);
dbconnection();
 const PORT=process.env_PORT || 5000;
app.listen(PORT,(error)=>{
  if(!error){
  logger.info(`Server is running on PORT ${PORT}`);
  }
  else{
    logger.error(`error--->${error}`)
  }
})