import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const transports=nodemailer.createTransport({
  service:"gmail",
  auth:{
    user:process.env.USER_EMAIL,
    pass:process.env.USER_PASS
  }
})
export default transports;