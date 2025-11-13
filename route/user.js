import express from "express";
const userRoute = express.Router();
import user from "../controller/user.js";
import auth from "../middleware/authentication.js";
import Authorization from "../middleware/authorization.js";

userRoute.post("/login", user.sendOtp);
userRoute.post("/verifyotp", user.otpVerify);
userRoute.post("/signup", auth, Authorization.preAuth, user.signup);
userRoute.post("/cart", auth, Authorization.userRole, user.addToCart);
userRoute.get("/dashboard", auth, Authorization.userRole, user.dashboard);
userRoute.get("/cart/info", user.cartInfo);
userRoute.post("/order/confirm", user.confirmOrder);
userRoute.get("/order/info/:orderId", user.orderInfo);
userRoute.get("/order/cancel/:orderId", user.cancelOrder);
userRoute.get("/orders/list", user.listTotalOrders);
// userRoute.post("/cartinfo", auth, Authorization.userRole, user.addToCart);
export default userRoute;
