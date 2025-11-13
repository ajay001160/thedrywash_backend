import express from "express";
const subAdminRoute=express.Router();
import subadmin from "../controller/subadmin.js";

subAdminRoute.post("/addservice",subadmin.addService);
subAdminRoute.post("/addserviceitem",subadmin.addServiceItem);
export default subAdminRoute;