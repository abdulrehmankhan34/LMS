import jwt from "jsonwebtoken";
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("SECRET EXISTS:", !!process.env.JWT_SECRET);
console.log("TOKEN RECEIVED:", token);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
     console.log("JWT ERROR:", error.name);
  console.log("JWT MESSAGE:", error.message);
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

export default authMiddleware;