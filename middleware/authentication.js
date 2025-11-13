import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../utility/logger.js";
dotenv.config();

const auth=async(req,res,next)=>{
  try{
    const userToken=req.header("Authorization") || null;
    logger.info("auth.js handler called")
    if(!userToken || !userToken.startsWith("Bearer ")){
      logger.warm("token mising")
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
     logger.error(`error---> ${error}`)
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