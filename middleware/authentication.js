import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../utility/logger.js";
dotenv.config();
const file="authentication.js"

const auth=async(req,res,next)=>{
  const middleware="auth"
  try{
    const userToken=req.header("Authorization") || null;
    logger.info(`[${file}][${middleware}] handler called`)
    if(!userToken || !userToken.startsWith("Bearer ")){
      logger.warn("token mising")
      return res.status(401).json({
        status:false,
        msg:"token missing"
      })
    }
    const token=userToken.replace("Bearer ","").trim()
    const decode=jwt.verify(token,process.env.JWT_SECRET);
    req.token=decode;
    next();
  }
  catch(error){
     logger.error(`[${file}][${middleware}]error---> ${error}`)
    if(error.name==="TokenExpiredError"){
      return res.status(401).json({
        status:false,
        msg:"token expired"
      })
    }
    else if(error.name==="JsonWebTokenError"){
      return res.status(401).json({
        status:false,
        msg:"invalid token"
      })
    }
    else{
     return res.status(500).json({
        status:false,
        msg:"intervel server error"
      })
    }
  }
}

export default  auth 