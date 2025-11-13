import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "./logger.js";
dotenv.config();
const jwtToken = (data) => {
  try {
    if (data.role === "pre-auth") {
      const payLoad = {
        role: data.role,
        number:data.number,
      };
      const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });
      return token;
    } else {
      const payLoad = {
        userId:data._id,
        role: data.role,
        number:data.number
      };
      const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
        expiresIn: "90d",
      });
      return token;
    }
  } catch (error) {
    logger.error(`error--->${error}`);
  }
};
export default jwtToken;
