import user from "../model/partner.js";
import order from "../model/order.js";
import logger from "../utility/logger.js";
import bcrypt from "bcrypt";
import jwt from "../utility/jwt.js";

const login = async (req, res) => {
  const handler = "login";
  const file = "partner.js";
  try {
    logger.info(`[${file}][${handler}] handler called`);
    const number = req.body?.number;
    const password = req.body?.password;
    if (!number || !password) {
      logger.warn(`argument missing`);
      return res.status(400).json({
        status: false,
        msg: "argument missing! Please give complete argument",
      });
    }
    const partnerInfo = await user.findOne({ number });
    if (!partnerInfo) {
      logger.warn(`No partner exist for +91-${number} `);
      return res.status(404).json({
        status: false,
        msg: `No partner exist for +91-${number}`,
      });
    }
    if (await bcrypt.compare(password, partnerInfo.password)) {
      const token = jwt(partnerInfo);
      return res.status(200).json({
        status: true,
        token: token,
        msg: "Successfully log in",
      });
    }
  } catch (error) {
    logger.info(`[${file}][${handler}] error--->${error}`);
    return res.status(500).json({
      status: false,
      msg: "Internal server error",
    });
  }
};


export default { login }
