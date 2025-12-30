const userRole = async (req, res, next) => {
  try {
    const { role } = req.token || {};
    if (!role) {
      return res.status(401).json({
        status: false,
        msg: "argument missing in token",
      });
    }
    if (role != "user") {
      return res.status(403).json({
        status: false,
        msg: "Unauthorized: No user information found",
      });
    }
    req.user=req.token;
    next();
  } catch (error) {
    return res.status(500).json({
      status: false,
      msg: "internal server error",
    });
  }
};

 const preAuth = async (req, res, next) => {
  try {
    const { role } = req.token || {};
    if (!role) {
      return res.status(401).json({
        status: false,
        msg: "argument missing in token",
      });
    }
    if (role != "pre-auth") {
      return res.status(403).json({
        status: false,
        msg: "Unauthorized: No user information found",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      status: false,
      msg: "internal server error",
    });
  }
};
export default { userRole, preAuth }
