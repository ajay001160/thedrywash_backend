import express from "express";
const subAdminRoute=express.Router();
import subadmin from "../controller/subadmin.js";
import partner from "../controller/partner.js";

subAdminRoute.post("/addservice",subadmin.addService);
subAdminRoute.post("/addserviceitem",subadmin.addServiceItem);
subAdminRoute.get("/orderinfo/:id",partner.orderInfo);
export default subAdminRoute;