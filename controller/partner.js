// import user from "../model/partner.js";
import order from "../model/order.js";
import logger from "../utility/logger.js";
import bcrypt from "bcrypt";
import jwt from "../utility/jwt.js";
const file = "partner.js";

const login = async (req, res) => {
  const handler = "login";
  try {
    logger.info(`[${file}][${handler}] handler called`);
    let number = req.body?.number;
    const password = req.body?.password;
    number=number?.toString().trim();
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

const orderList = async (req, res) => {
  const handler = "pickup";
  try {
    logger.info(`[partner][${handler}] handler called`);
    const { partnerId } = req.partner || {};
    if (!partnerId) {
      logger.warn(`Argument missing inside the token`);
      return res.status(401).json({
        status: false,
        msg: "Argument mising inside the token",
      });
    }
    const pickUpOrders = await order
      .find(
        { status: "pending", "address.sector": sector },
        { status: 1, totatlPrice: 1, address: 1, orderDate: 1 , number:1 , orderId:1 }
      )
      .sort({ createdAt: 1 });
    if (pickUpOrders.length <= 0) {
      logger.warn("No oder for pickup");
      return res.status(404).json({
        status: true,
        msg: "No order to pick up",
      });
    }
    logger.info(`Order Fetch Successfully`);
    return res.status(200).json({
      status: true,
      orderList: pickUpOrders,
    });
  } catch (error) {
    logger.error(`[partner.js][${handler}]error--->${error}`);
    return res.status(500).json({
      status: false,
      msg: "Internal server	error",
    });
  }
};

const orderInfo=async(req,res)=>{
  const handler="orderInfo";
  try{
    logger.info(`[${file}][${handler}] handler called`)
    let orderId=req.params?.id;
    const partnerId=req.partner?.partnerId;
    orderId=orderId?.toString().trim();
    logger.info(`[orderId]--->${orderId}`)
    if(!orderId){
    // if(!orderId || !partnerId){
      logger.warn(`Argument missing`);
      return res.status(400).json({
        status:false,
        msg:"Please give complete argument"
      })
    }
    let info=await order.findOne({orderId:orderId}).lean();
    // let info=await order.findOne({orderId:orderId}).populate("items.serviceId").populate("items.itemId").lean();
    if(!info){
      logger.warn(`No order found for this orderId`)
      return res.status(404).json({
        status:true,
        msg:"no order find for this orderId",
      })
    }
    let array=[];
    for(const i of info.items){
    const matchService=array.find((y)=>{ y.serviceId===i.serviceId?.toString();  console.log(` y--->${y.serviceId}`)})
   
    console.log(` i--->${i.serviceId}`)
    if(matchService){
      console.log("item match");
      matchService.items.push({itemName:i.item,quantity:i.quantity})
    
    }
    else{
      console.log("item  not match");
      let temp={serviceName:i.serviceId,items:[{itemName:i.itemId,quantity:i.quantity}],totatlPrice:i.totatlPrice};
      array.push(temp);
    }
    }
    info.items=array;
    return res.status(200).json({
      status:true,
      orderInfo:info,
      msg:"order info fetch successfully"
    })
  }catch(error){
    logger.error(`[${file}][${handler}]error--->${error}`)
    return res.status(500).json({
      status:false,
      msg:"Internal server error"
    })
  }
}
export default { login, orderList, orderInfo };
