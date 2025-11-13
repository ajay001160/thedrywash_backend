import mainSer from "../model/service.js";
import logger from "../utility/logger.js";
import serviceItem from "../model/serviceItem.js";

const addService = async (req, res) => {
  const func = "addService";
  try {
    logger.info(`${func} Handler called`);
    const { service, option } = req.body || {};
    if (!service) {
      logger.info("error--->Please give complete Argument");
      return res.status(400).json({
        status: false,
        msg: "Please give complete argument",
      });
    }
    const saveData = await mainSer.create({ service: service });
    return res.status(200).json({
      status: true,
      msg: "Service save Sucessfully",
    });
  } catch (error) {
    logger.error(`error---> ${error}`);
    return res.status(500).json({
      status: false,
      msg: "something went wrong",
    });
  }
};

const addServiceItem = async (req, res) => {
  const func = "addServiceItem";
  try {
    logger.info(`${func} Handler called`);
    const { item,price,serviceId } = req.body || {};
    if (!item || !price || !serviceId) {
      logger.info("error--->Please give complete Argument");
      return res.status(400).json({
        status: false,
        msg: "Please give complete argument",
      });
    }
    const saveData = await serviceItem.create({ serviceId,price,item });
    const saveItemId = await mainSer.findByIdAndUpdate(serviceId,{$push:{serviceItems:saveData._id}});
    return res.status(200).json({
      status: true,
      msg: "Service save Sucessfully",
    });
  } catch (error) {
    logger.error(`error---> ${error}`);
    return res.status(500).json({
      status: false,
      msg: "something went wrong",
    });
  }
};
export default { addService, addServiceItem };
