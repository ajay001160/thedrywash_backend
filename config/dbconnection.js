import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../utility/logger.js";
dotenv.config();
 const dbconnection = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    logger.info("Database Connection Successfully");
  } catch (error) {
    logger.error("error--->" + error);
    process.exit(1);
  }
};
export default dbconnection;
