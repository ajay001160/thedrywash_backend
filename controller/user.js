import user from "../model/user.js";
import tempOtp from "../model/otp.js";
import loginTrack from "../model/loginTrack.js";
import service from "../model/service.js";
import cart from "../model/cart.js";
import order from "../model/order.js";
import jwt from "jsonwebtoken";
import jwtToken from "../utility/jwt.js";
import bcrypt from "bcrypt";
import logger from "../utility/logger.js";
import transports from "../config/mail.js";
import checkEmailFormat from "../utility/checkEmailFormat.js";
import dotenv from "dotenv";
import serviceItem from "../model/serviceItem.js";

dotenv.config();

const signup = async (req, res) => {
  const C = "signup";
  try {
    const { name, email, address, role } = req.body || {};
    const number = req.token?.number || null;
    const { flateNo, floor, sector, locality } = address;
    logger.error(`[user.js][${C}] Function Called`);
    console.log(name, email, number, role, flateNo, sector, locality);
    if (
      !name ||
      !email ||
      !number ||
      !role ||
      !flateNo ||
      !sector ||
      !locality
    ) {
      logger.error(" Some Argument Missing");
      return res.status(400).json({
        status: false,
        msg: "Please give complete Argument",
      });
    }
    if (!checkEmailFormat(email)) {
      logger.error("Wrong Email Format");
      return res.status(400).json({
        status: false,
        msg: "Please Give Correct Email Format",
      });
    }
    const checkUser = await user.findOne({ number: number });
    if (checkUser) {
      logger.error("User Already exist");
      return res.status(409).json({
        status: false,
        msg: "User Already Exist",
      });
    }
    const userObj = new user({
      name,
      number,
      email,
      role,
      address: {
        flateNo: flateNo,
        floor: floor,
        sector: sector,
        locality: locality,
      },
    });
    const saveUser = await userObj.save();
    await loginTrack.findOneAndUpdate(
      { number: number },
      { accountStatus: "1" }
    );
    logger.info("User Register Successfully");
    const token = jwtToken(saveUser);
    return res.status(200).json({
      status: true,
      msg: "User Registered Successfully",
      name: saveUser.name,
      token: token,
    });
  } catch (error) {
    logger.error(`[user.js][${C}] error--->${error}`);
    res.status(500).json({
      status: false,
      msg: "Internal Server Error.Please Try Again Later ",
    });
  }
};

const sendOtp = async (req, res) => {
  const C = "sentOtp";
  try {
    logger.info(`[user.js] [${C}] Handler Called`);
    // let { number } = req.body || {};
    let email;
    const number = req.body?.number;
    if (number === "9525590691") {
      email = "hamidnawazktr7@gmail.com";
    } else {
      email = "piyushhyadavv21@gmail.com";
    }

    if (!number) {
      logger.info("Please give complete argument");
      return res.status(400).json({
        status: false,
        msg: "Please give complete argument",
      });
    }
    //  const email="piyushhyadavv21@gmail.com";
    const otp = Math.floor(Math.random() * 1000000).toString();
    await transports.sendMail({
      from: `"The Dry Wash" <${process.env.USER_EMAIL}>`,
      to: email,
      subject: "Your The Dry Wash App OTP",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`, // plain text fallback
      html: `<p>Hello,</p>
         <p>Your OTP for Laundry App login is:</p>
         <h2 style="color:#007BFF;">${otp}</h2>
         <p>Please use this code within 5 minutes. If you did not request this, ignore this email.</p>
         <p>Thank you,<br/> The Dry Wash Laundry App Team</p>`,
    });

    // const hashOtp = otp;
    const hashOtp = await bcrypt.hash(otp, 10);
    const saveTempOtp = await tempOtp.create({ number: number, otp: hashOtp });
    await loginTrack.create({ number: number });
    logger.info("OTP sent successfully to the number");
    return res.status(200).json({
      status: true,
      msg: `OTP sent successfully to +91-${number}`,
    });
  } catch (error) {
    logger.warn(`[user.js] [${C}] error---> ${error}`);
    return res.status(500).json({
      status: false,
      msg: "Internal server error",
    });
  }
};

const otpVerify = async (req, res) => {
  const C = "otpVerify";
  try {
    logger.info(`[user.js] [${C}] Handler Called`);
    const { otp, number } = req.body || {};
    let userRegiestered = false;
    if (!otp || !number) {
      logger.error("Please give give complete argument");
      return res.status(400).json({
        status: false,
        msg: "Please give complete argument",
      });
    }
    const verifyOtp = await tempOtp
      .findOne({ number: number })
      .sort({ createdAt: -1 });
    if (verifyOtp) {
      if (await bcrypt.compare(otp, verifyOtp.otp)) {
        const checkUser = await user.findOne({ number: number });
        if (checkUser) {
          const token = jwtToken(checkUser);
          userRegiestered = true;
          logger.info("OTP verified successfully and user exist");
          return res.status(200).json({
            status: true,
            token: token,
            msg: "OTP verified successfully and user exist",
            userRegiestered: userRegiestered,
          });
        } else {
          const notExist = { role: "pre-auth", number: number };
          const token = jwtToken(notExist);
          logger.info("OTP verified successfully but usernot exist");
          return res.status(200).json({
            status: true,
            msg: "No user found",
            userRegiestered: userRegiestered,
            tempToken: token,
          });
        }
      } else {
        logger.error(" Invalid OTP ");
        return res.status(401).json({
          status: false,
          msg: "Invalid OTP",
        });
      }
    } else {
      logger.error("Not a valid user");
      return res.status(404).json({
        status: false,
        msg: "Not a valid user",
      });
    }
  } catch (error) {
    logger.error(`error--->${error}`);
    return res.status(500).json({
      status: false,
      mag: "Internal server error",
    });
  }
};

const addToCart = async (req, res) => {
  const handler = "addToCart";
  try {
    logger.info(`[user.js], [${handler}] handler called`);

    const { itemId, serviceId } = req.body || {};
    let quantity = req.body.quantity;
    // const userId = req.user.userId;  assume userId comes from auth middleware
    const userId = req.body.userId;

    if (!serviceId || !itemId || !quantity) {
      logger.warn(`[${handler}] [user.js] Please provide complete arguments`);
      return res.status(400).json({
        status: false,
        msg: "Please provide complete arguments",
      });
    }

    quantity = parseInt(quantity);
    logger.info(`no of quantaty--->${quantity}`);
    if (quantity === 0 || quantity < -1) {
      logger.warn(
        `[${handler}] [user.js] Quantity must be a positive number or -1 allow at a time`
      );
      return res.status(400).json({
        status: false,
        msg: "Quantity must be a positive number or -1 allow at a time",
      });
    }

    const itemInfo = await serviceItem.findById(itemId);
    if (!itemInfo) {
      logger.warn(`[${handler}] [user.js] Item not found`);
      return res.status(404).json({
        status: false,
        msg: "Item not found",
      });
    }
    let newCart;
    // Check if the user already has a cart
    const userCart = await cart.findOne({ userId });
    if (userCart) {
      // Check if this item already exists in the cart
      const matchedItem = userCart.items.find(
        (i) =>
          i.serviceId.toString() === serviceId && i.itemId.toString() === itemId
      );
      if (matchedItem) {
        // Update quantity
        let newQuantity = parseInt(matchedItem.quantity) + quantity;
        let totalPrice =
          parseInt(userCart.totalPrice) + parseInt(quantity * itemInfo.price);
        totalPrice = totalPrice.toString();
        newQuantity = newQuantity.toString();
        if (newQuantity <= 0) {
          // Remove the item if quantity becomes 0
          newCart = await cart.findOneAndUpdate(
            { userId, "items.itemId": itemId, "items.serviceId": serviceId },
            { $pull: { items: { serviceId, itemId } }, $set: { totalPrice } },
            { new: true }
          );
        } else {
          // Update the quantity and total price
          logger.info(
            `[totalPrice][${totalPrice}][newQuantity][${newQuantity}]user exist and item found updating it`
          );
          newCart = await cart.findOneAndUpdate(
            { userId, "items.itemId": itemId, "items.serviceId": serviceId },
            {
              $set: { "items.$.quantity": newQuantity, totalPrice: totalPrice },
            },
            { new: true }
          );
        }
      } else {
        // Item does not exist in cart, push new item
        let totalPrc =
          parseInt(userCart.totalPrice) + parseInt(quantity * itemInfo.price);
        totalPrc = totalPrc.toString();
        logger.info("user exist but item not exist");
        newCart = await cart.findOneAndUpdate(
          { userId },
          {
            $push: {
              items: { serviceId, itemId, quantity },
            },
            $set: { totalPrice: totalPrc },
          },
          { new: true }
        );
      }
    } else {
      logger.info("user not exist adding new in the cart model");
      quantity = quantity.toString();
      // Create a new cart for the user
      newCart = await cart.create({
        userId,
        items: [{ serviceId: serviceId, itemId: itemId, quantity: quantity }],
        totalPrice: quantity * itemInfo.price,
      });
    }
    //To find the quantity of the added item--->
    // let itemQuantity;
    // itemQuantity = await cart.findOne({
    //   userId: userId,
    //   "items.serviceId": serviceId,
    //   "items.itemId": itemId,
    // });
    const matchItem = newCart.items.find(
      (i) =>
        i.serviceId.toString() === serviceId && i.itemId.toString() === itemId
    );
    if (matchItem) {
      let UpdateQuantity = matchItem.quantity.toString();
    } else {
      let UpdateQuantity = 0;
    }
    logger.info(`${userId} --> Item saved to cart`);
    return res.status(200).json({
      status: true,
      UpdatedQnt: UpdateQuantity,
      noOfItem: newCart.length,

      msg: "Item saved to cart",
    });
  } catch (error) {
    logger.error(`[${handler}] [user.js] error ---> ${error}`);
    return res.status(500).json({
      status: false,
      msg: "Internal server error",
    });
  }
};

const dashboard = async (req, res) => {
  const handler = "dashboard";
  try {
    logger.info(` [user.js] [${handler}] hanlder called`);
    const userId = req.user?.userId;
    if (!userId) {
      logger.warn("argument missing inside the token");
      return res.status(400).json({
        status: false,
        msg: "argument missing inside the token",
      });
    }
    const serviceInfo = await service.find({}, { service: 1 });
    const userInfo = await user.findById(userId, {
      name: 1,
      number: 1,
      address: 1,
    });
    if (!userInfo) {
      logger.warn("user not found");
      return res.status(404).json({
        status: false,
        msg: "user not found",
      });
    } else {
      const cartInfo = await cart.findOne({ userId: userId });
      if (cartInfo) {
        if (cartInfo.items.length > 0) {
          logger.info("user,cart,service fetch seccessfully");
          return res.status(200).json({
            status: true,
            msg: "user,cart,service fetch seccessfully",
            cart: cartInfo.items.length,
            userInfo: userInfo,
            service: serviceInfo,
          });
        } else if (cartInfo.items.length <= 0) {
          logger.info(
            "user,cart,service fetch seccessfully but no item in the cart"
          );
          return res.status(200).json({
            status: true,
            msg: "user,cart,service fetch seccessfully",
            cart: 0,
            userInfo: userInfo,
            service: serviceInfo,
          });
        }
      } else {
        logger.info("cart not exist");
        return res.status(200).json({
          status: true,
          cart: false,
          userInfo: userInfo,
          service: serviceInfo,
        });
      }
    }
  } catch (error) {
    logger.error(`[user.js]  [${handler}] error--->${error}`);
    return res.status(500).json({
      status: false,
      msg: "internal server error",
    });
  }
};
const cartInfo = async (req, res) => {
  const handler = "cartInfo";
  try {
    logger.info(` [user.js] [${handler}] handler called `);
    const userId = req.user?.userId || req.body?.userId;
    if (!userId) {
      logger.warn("argument missing inside token");
      return res.status(400).json({
        status: false,
        msg: "argumnt missing inside token",
      });
    }
    const cartInfo = await cart
      .findOne({ userId: userId })
      .populate("items.itemId", "price item")
      .populate("items.serviceId", "service");
    const array = [];
    if (cartInfo.items.length > 0) {
      for (const info of cartInfo.items) {
        const existService = array.find(
          (i) => i.serviceId._id.toString() === info.serviceId._id.toString()
        );
        if (!existService) {
          const temp = {
            serviceId: info.serviceId,
            items: [{ itemId: info.itemId, quantity: info.quantity }],
          };
          array.push(temp);
          // const temp={serviceId:info.serviceId,items:[{ itemId:info.itemId,quantity:quantity,price:price}]}
        } else {
          const temp = { itemId: info.itemId, quantity: info.quantity };
          existService.items.push(temp);
        }
        cartInfo.items = array;
      }

      logger.info(`Data fetch successfully`);
      return res.status(200).json({
        status: true,
        msg: "Data fetch seccessfully",
        cart: array,
      });
    } else {
      return res.status(200).json({
        status: false,
        msg: "no item in the cart",
      });
    }
  } catch (error) {
    logger.log(`[user.js] [${handler}] error---.${error}`);
    return res.status(500).json({
      status: false,
      msg: "internal server error",
    });
  }
};

const updateData = async (req, res) => {
  const handler = "updateData";
  try {
    logger.log(`[user.js][${handler}] handler called`);
    const userId = req.token?.userId;
    const address = req.bodty?.address;
    const number = req.body?.number;
    const email = req.body?.email;
    if (!userId) {
      logger.warn("Incomplete argument in the token");
      return res.status(400).json({
        status: false,
        ms: "Incomplete argument in the token",
      });
    }
    if (!address || !number || email) {
      logger.warn("Incomplete argument");
      return res.status(400).json({
        status: false,
        msg: "Incomplete parameter",
      });
    }
    const updatedata = await user.findByIdAndUpdate(
      userId,
      {
        $set: {
          address: {
            flateNo: flateNo,
            floor: floor,
            sector: sector,
            locality: locality,
          },
        },
      },
      { new: true }
    );
    return res.status(200).json({
      status: true,
      msg: "Address updated successfully",
      updateData: updatedDate,
    });
  } catch (error) {
    logger.log(`[user.js][${handler} handler called]`);
    return res.status(500).json({
      status: false,
      msg: "internal server error",
    });
  }
};

const confirmOrder = async (req, res) => {
  const handler = "confirmOrder";
  try {
    logger.info(`[user.js][${handler}] handler called`);
    const userId = req.user?.userId || req.body?.userId;
    if (!userId) {
      logger.warn(`argument missing in the token`);
      return res.status(400).json({
        status: false,
        msg: "argument missing in the token",
      });
    }
    const cartItems = await cart.findOne({ userId: userId }).lean();
    if (cartItems.items.length < 1) {
      logger.warn(`no item inside the cart to order`);
      return res.status(404).json({
        status: false,
        msg: "no item inside the cart to order",
      });
    }
    const orderId = `ORD-${Date.now().toString()}-${Math.floor(
      Math.random() * 100
    ).toString()}`; // order ID from 18-20
    //unique number order Id for each user--->
    const items = cartItems.items;
    const userAddress = await user.findById(userId, { address: 1, number: 1 });
    const cnfOrder = await order.create({
      orderId: orderId,
      userId: userId,
      address: userAddress.address,
      number: userAddress.number,
      items: items,
    });
    logger.info(items);
    return res.status(200).json({
      status: true,
      msg: "items",
      order: cnfOrder,
    });
  } catch (error) {
    logger.error(`[user.js][${handler}] error---> ${error}`);
    return res.status(500).json({
      status: false,
      msg: "internal server error",
    });
  }
};

const orderInfo = async (req, res) => {
  const handler = "orderInfo";
  try {
    logger.info(`[user.js][${handler}] handler called`);
    const orderId = req.params?.orderId;
    logger.info(`[${orderId}] orderId`);
    if (!orderId) {
      logger.warn(`argument mising`);
      return res.status(400).json({
        status: true,
        msg: "argument missing",
      });
    }
    const odrInfo = await order.findOne({ orderId: orderId }).lean();
    if (!odrInfo) {
      logger.warn(`no data available for this orderId`);
      return res.status(404).json({
        status: false,
        msg: "no data data available for this orderId",
      });
    }
    const array = [];
    const itemArray = [];
    odrInfo.items.forEach((items) => {
      const matchItem = array.find(
        (i) => i.serviceId.toString() === items.serviceId.toString()
      );
      if (matchItem) {
        matchItem.itemArray.push({
          itemId: items.itemId,
          quantity: items.quantity,
        });
      } else {
        const temp = {
          serviceId: items.serviceId,
          itemArray: [{ itemId: items.itemId, quantity: items.quantity }],
          totalPrice: items.totalPrice,
        };
        array.push(temp);
      }
    });
    odrInfo.items = array;
    logger.info(`data arranged successfully`);
    return res.status(200).json({
      status: true,
      orderItems: odrInfo,
    });
  } catch (error) {
    logger.error(`[user.js][${handler}]error--->${error}`);
    return res.status(500).json({
      status: false,
      msg: "internal server error",
    });
  }
};
const cancelOrder = async (req, res) => {
  const handler = "cancelOrder";
  try {
    const orderId = req.params.orderId;
    logger.info(`[${handler}] orderId`);
    if (!orderId) {
      logger.warn(`argument missing`);
      return res.status(400).json({
        status: false,
        msg: "argument missing",
      });
    }
    const orderInfo = await order.findOne({ orderId: orderId });
    if (
      !orderInfo ||
      orderInfo.status === "delivered" ||
      orderInfo.status === "cancelled"
    ) {
      logger.warn(
        `[${orderInfo?.status}] --->action not allow for cancellation `
      );
      return res.status(404).json({
        status: false,
        msg: `action not allow already [${orderInfo?.status}]`,
      });
    }
    const newStatus = await order.findOneAndUpdate(
      { orderId: orderId },
      { status: "cancelled" },
     { new: true, projection: { status: 1 } }
    );//it take only three argiment--->
    logger.info(newStatus);
    logger.info(`[${newStatus.status}]--->Order Cancelled Sucessfully`);
    return res.status(200).json({
      status: true,
      msg: "Order cancelled successfully",
    });
  } catch (error) {
    logger.error(`[user.js][${handler}]--->${error}`);
    return res.status(500).json({
      status: false,
      msg: "internal server error",
    });
  }
};

const listTotalOrders = async (req, res) => {
  const handler = "listTotalOrders";
  try {
    logger.info(`[user.js][${handler}] Handler called`);
    const status = req.query?.status || null;
    const userId = req.token?.userId || req.query?.userId;
    if (!status || !userId) {
      logger.warn(`argument missing status or userId`);
      return res.status(400).json({
        status: false,
        msg: "argument missing",
      });
    }
    const ordersList=await order.find({userId:userId,status:status}).sort({createdAt:-1});
    if(ordersList.length==0){
      logger.warn(`no order for this status [${status}]}`)
      return res.status(404).json({
        status:false,
        msg:"No order Available"
      })
    }
    let newList=ordersList.map((i)=>{ return {id:i._id,orderid:i.orderId,orderDate:i.orderDate,updatedAt:i.updatedAt,status:i.status}})
    logger.info(`data arrange successfully`);
    return res.status(200).json({
      status:true,
      ordersList:newList
    })
  } catch (error) {
    logger.error(`[user.js][${handler} error--->${error}]`)
    return res.status(500).json({
      status:false,
      msg:"internal server error"
    })
  }
};

export default {
  signup,
  sendOtp,
  otpVerify,
  addToCart,
  dashboard,
  cartInfo,
  updateData,
  confirmOrder,
  orderInfo,
  cancelOrder,
  listTotalOrders
};
