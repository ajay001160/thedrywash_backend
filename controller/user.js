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
import twilio from "twilio/lib/rest/Twilio.js";
import mongoose from "mongoose";
import { json, response } from "express";

dotenv.config();
const file = "user.js";
const signup = async (req, res) => {
  const C = "signup";
  try {
    logger.error(`[user.js][${C}] Function Called`);
    let {
      name,
      gender,
      city,
      society,
      floor,
      flat,
      sector,
      email,
      alternateNumber,
    } = req.body || {};
    alternateNumber = alternateNumber?.toString().trim() || "";
    const number = req.token?.number || null;
    flat = flat?.toString();
    floor = floor?.toString();
    logger.error(
      `[name]--->${name}[gender]--->${gender}[email]--->${email} [city]--->${city} [sector]--->${sector}[society]--->${society}[floor]--->${floor} [flat]--->${flat}[alternateNumber]--->${alternateNumber}`
    );

    if (
      !name ||
      !email ||
      !number ||
      !alternateNumber ||
      !flat ||
      !sector ||
      !floor ||
      !city ||
      !society
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
      gender,
      alternateNumber,
      number,
      email,
      address: {
        flateNo: flat,
        floor: floor,
        sector: sector,
        society_locality: society,
        city: city,
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
    let number = req.body?.number;
    number = number?.toString().trim();
    logger.info(`[number]--->[${number}]`);
    if (!number) {
      logger.warn("Please give complete argument");
      return res.status(400).json({
        status: false,
        msg: "Please give complete argument",
      });
    }
    if (number.length !== 10) {
      logger.warn(`incomplete number +91${number}`);
      return res.status(400).json({
        status: false,
        msg: "Incomplete number ",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const client = new twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    const sms = await client.messages.create({
      body: ` Your TheDryWash verification code is ${otp}. Please do not share this code with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${number}`,
    });
    const hashOtp = await bcrypt.hash(otp, 10);
    const saveTempOtp = await tempOtp.create({
      number: number,
      otp: hashOtp,
    });
    logger.info(`OTP sent successfully to the number +91${number}`);
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
    let { otp, number } = req.body || {};
    otp = otp?.toString().trim() || "";
    number = number?.toString().trim() || "";
    let userRegiestered = false;
    logger.info(`[number]--->[${number}][otp]--->[${otp}]`);
    if (!otp || !number || number.length !== 10 || otp.length !== 6) {
      logger.error(
        `[number]--->[${number}][otp]--->[${otp}]Please give give complete argument`
      );
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
          await loginTrack.create({ number: number });
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
    const itemId = req.params?.itemId?.trim() || "";
    const serviceId = req.params?.serviceId?.trim() || "";
    let quantity = req.body?.quantity?.trim() || "";
    const userId = req.user?.userId || req.body?.userId || "";
    logger.info(
      `[${file}][${handler}] [HANDLER_CALLED] | userId = ${userId}, serviceId= ${serviceId}, itemId= ${itemId}, quantity =${quantity}`
    );
    if (!serviceId || !itemId || !quantity || !userId) {
      logger.warn(
        `[${file}][${handler}] [ARGUMENT_MISSING] | userId = ${userId},serviceId=${serviceId},itemId= ${itemId},quantity =${quantity}`
      );
      return res.status(400).json({
        status: false,
        msg: "Please provide complete arguments",
      });
    }
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(serviceId) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      logger.info(
        `[${file}][${handler}] [INVALID_ARGUMET_FORMAT] | userId = ${userId}, serviceId= ${serviceId}, itemId= ${itemId}, quantity =${quantity}`
      );
      return res.status(400).json({
        status: false,
        msg: "Invalid argument format",
      });
    }
    quantity = Number(quantity); // if any req containing alphabet will NaN;

    if (
      Number.isNaN(quantity) ||
      !Number.isInteger(quantity) ||
      (quantity !== -1 && quantity !== 1)
    ) {
      logger.warn(
        `[${file}][${handler}][INVALID_QUANTITY] | quantity=${quantity}`
      );
      return res.status(400).json({
        status: false,
        msg: "Quantity must be either -1 or 1",
      });
    }

    const itemInfo = await serviceItem.findById(itemId);
    const userInfo = await user.findById(userId);
    const serviceInfo = await service.findById(serviceId);
    if (!itemInfo || !userInfo || !serviceInfo) {
      logger.warn(
        `[${file}][${handler}] [NO_RECORD_FOUND] | userId= ${userId} ,itemId= ${itemId} , serviceId =${serviceId}`
      );
      return res.status(404).json({
        status: false,
        msg: "No record found",
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
        let itemTotalPrice =
          parseInt(matchedItem.price) +
          parseInt(quantity) * parseInt(itemInfo.price);
        console.log(itemTotalPrice);
        let totalPrice =
          parseInt(userCart.totalPrice) +
          parseInt(quantity) * parseInt(itemInfo.price);
        totalPrice = totalPrice.toString();
        newQuantity = newQuantity.toString();
        itemTotalPrice = itemTotalPrice.toString();
        if (newQuantity <= 0) {
          // Remove the item if quantity becomes 0
          logger.info(
            `[${file}][${handler}] [NEW_QUANTITY = 0] [REMOVE_CART_ITEM] | newQuantity = ${newQuantity}, UpdatedTotalPrice = ${totalPrice}`
          );
          newCart = await cart.findOneAndUpdate(
            { userId, "items.itemId": itemId, "items.serviceId": serviceId },
            { $pull: { items: { serviceId, itemId } }, $set: { totalPrice } },
            { new: true }
          );
          logger.info(
            `[${file}][${handler}] [CART_UPDATED_SUCCESSFULLY] | newQuantity = ${newQuantity}, UpdatedTotalPrice = ${totalPrice}`
          );
          return res.status(200).json({
            status: true,
            newQuantity: quantity,
            itemTotalPrice: itemTotalPrice,
            noOfItemInCart: newCart.items.length,
            cartTotalPrice: newCart.totalPrice,
            msg: "Cart Updated Successfully",
          });
        } else {
          // Update the quantity and total price
          logger.info(
            `[${file}][${handler}] [NEW_QUANTITY > 0] [INCREASE_ITEM_COUNT] | newQuantity = ${newQuantity}, UpdatedTotalPrice = ${totalPrice}`
          );
          newCart = await cart.findOneAndUpdate(
            { userId, "items.itemId": itemId, "items.serviceId": serviceId },
            {
              $set: {
                "items.$.quantity": newQuantity,
                "items.$.price": itemTotalPrice,
                totalPrice: totalPrice,
              },
            },
            { new: true }
          );
          logger.info(
            `[${file}][${handler}] [CART_UPDATED_SUCCESSFULLY] | newQuantity = ${newQuantity}, UpdatedTotalPrice = ${totalPrice}`
          );
          return res.status(200).json({
            status: true,
            newQuantity: newQuantity,
            itemTotalPrice: itemTotalPrice,
            noOfItemInCart: newCart.items.length,
            cartTotalPrice: newCart.totalPrice,
            msg: "Cart Updated Successfully",
          });
        }
      } else {
        // Item does not exist in cart, push new item
        if (quantity <= 0) {
          //item not exist in cart but user use quantaty -1
          logger.warn(
            `[${file}][${handler}] [ACTION_NOT_ALLOWED] | rule=quantity must positive if item not exist in cart | quantity = ${quantity}`
          );
          return res.status(400).json({
            status: false,
            msg: "Action not allowed",
          });
        }
        // itemTotalPrice = itemInfo.price;
        let totalPrc =
          parseInt(userCart.totalPrice) +
          parseInt(quantity) * parseInt(itemInfo.price);
        totalPrc = totalPrc.toString();
        logger.info(
          `[${file}][${handler}] [ITEM_NOT_EXIT] | msg=item not exist in cart | quantity = ${quantity}, ItemTotalPrice=${itemInfo.price}, UpdatedTotalPrice=${totalPrc}`
        );
        newCart = await cart.findOneAndUpdate(
          { userId },
          {
            $push: {
              items: { serviceId, itemId, price: itemInfo.price, quantity },
            },
            $set: { totalPrice: totalPrc },
          },
          { new: true }
        );

        logger.info(
          `[${file}][${handler}] [CART_UPDATED_SUCCESSFULLY] | newQuantity = ${quantity}, UpdatedTotalPrice = ${totalPrc}`
        );
        return res.status(200).json({
          status: true,
          newQuantity: quantity,
          itemTotalPrice: itemInfo.price,
          noOfItemInCart: newCart.items.length,
          cartTotalPrice: newCart.totalPrice,
          msg: "Cart Updated Successfully",
        });
      }
    } else {
      if (quantity <= 0) {
        //item not exist in cart but user use quantaty -1
        logger.warn(
          `[${file}][${handler}] [ACTION_NOT_ALLOWED] | rule=quantity must positive if cart not exist for user | quantity = ${quantity}`
        );
        return res.status(400).json({
          status: false,
          msg: "Action not allowed",
        });
      }
      quantity = quantity.toString();
      // const nPrice = parseInt(itemInfo.price);
      // Create a new cart for the user
      logger.info(
        `[${file}][${handler}] [CART_NOT_EXIST] | msg=Cart not exist for the user | userCart=${userCart}, quantity=${quantity}, itemsPrice=${parseInt(
          itemInfo.price
        )},cartTotalPrice=${parseInt(itemInfo.price)}`
      );
      newCart = await cart.create({
        userId,
        items: [
          {
            serviceId: serviceId,
            itemId: itemId,
            price: itemInfo.price,
            quantity: quantity,
          },
        ],
        totalPrice: quantity * itemInfo.price,
      });
      logger.info(
        `[${file}][${handler}] [CART_UPDATED_SUCCESSFULLY] | newQuantity = ${quantity}, UpdatedTotalPrice = ${itemInfo.price}`
      );
      return res.status(200).json({
        status: true,
        newQuantity: quantity,
        itemTotalPrice: itemInfo.price,
        noOfItemInCart: newCart.items.length,
        cartTotalPrice: newCart.totalPrice,
        msg: "Cart Updated Successfully",
      });
    }
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
const itemsList = async (req, res) => {
  const handler = "itemsList";
  try {
    const serviceId = req.params?.serviceId?.trim() || "";
    const userId = req.userId?.userId || req.params?.userId;
    logger.info(
      `[${file}] [${handler}] [HANDLER_CALLED] | serviceId= ${serviceId}`
    );
    if (!serviceId || !userId) {
      logger.warn(
        ` [${file}] [${handler}] [ARGUMENT_MISSING] | serviceId= ${serviceId}, userId= ${userId}`
      );
      return res.status(400).json({
        status: false,
        msg: "Argument missing",
      });
    }
    if (
      !mongoose.Types.ObjectId.isValid(serviceId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      logger.warn(
        ` [${file}] [${handler}] [INVALID_INPUT_TYPE] | serviceId= ${serviceId}, userId= ${userId}`
      );
      return res.status(400).json({
        status: false,
        msg: "Invalid input argumrnt",
      });
    }
    const userInfo = await user.findById(userId);
    if (!userInfo) {
      logger.warn(
        ` [${file}] [${handler}] [No_USER_FOUND] | userId= ${userId}`
      );
      return res.status(400).json({
        status: false,
        msg: "No user found for this userId",
      });
    }
    const itemsList = await serviceItem
      .find({ serviceId: serviceId })
      .populate("serviceId", "service");
    if (!itemsList.length === 0) {
      logger.info(
        ` [${file}] [${handler}] [NO_ITEMS_FOUND] | serviceId= ${serviceId}, itemsList= null`
      );
      return res.status(400).json({
        status: false,
        msg: "No items for this service",
      });
    }
    logger.info(
      ` [${file}] [${handler}] [ITEMS_FETCHED] | serviceId= ${serviceId}`
    );
    const itemInCart = await cart.findOne({
      userId: userId,
      "items.service": serviceId,
    });
    if (itemInCart) {
      let matchedItem = [];
      for (const info of itemInCart.items) {
        if (info.serviceId.toString() === serviceId) {
          matchedItem.push(info.itemId);
        }
      }
      logger.info(
        `[${file}] [${handler}] [CART_ITEM_FETCH] | serviceId=${serviceId} , cartItems= ${itemInCart?.items?.length}`
      );
      return res.status(200).json({
        status: true,
        msg: "Data fetch Seccessfully",
        items: itemsList,
        cartItem: matchedItem,
      });
    } else {
      logger.info(
        `[${file}] [${handler}] [NO_CART_ITEMS] | serviceId= ${serviceId} , cartItems= ${itemInCart?.items?.length}`
      );
      return res.status(200).json({
        status: true,
        msg: "Data fetch seccessfully but no item in the cart for this serviceId",
        items: itemsList,
        cartItem: false,
      });
    }
  } catch (error) {
    logger.info(
      `[${file}] ${handler} [Internal server error] | error=${error}`
    );
    return res.status(500).json({
      status: false,
      msg: "Internal server error",
    });
  }
};

const cartInfo = async (req, res) => {
  const handler = "cartInfo";
  try {
    logger.info(` [user.js] [${handler}] handler called `);
    const userId = req.user?.userId;
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
    ); //it take only three argiment--->
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
    const ordersList = await order
      .find({ userId: userId, status: status })
      .sort({ createdAt: -1 });
    if (ordersList.length == 0) {
      logger.warn(`no order for this status [${status}]}`);
      return res.status(404).json({
        status: false,
        msg: "No order Available",
      });
    }
    let newList = ordersList.map((i) => {
      return {
        id: i._id,
        orderid: i.orderId,
        orderDate: i.orderDate,
        updatedAt: i.updatedAt,
        status: i.status,
      };
    });
    logger.info(`data arrange successfully`);
    return res.status(200).json({
      status: true,
      ordersList: newList,
    });
  } catch (error) {
    logger.error(`[user.js][${handler} error--->${error}]`);
    return res.status(500).json({
      status: false,
      msg: "internal server error",
    });
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
  listTotalOrders,
  itemsList,
};
