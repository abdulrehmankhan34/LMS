import express from "express";
import dotenv from "dotenv";
import User from "./models/User.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import authMiddleware from "./middleware/authMiddleware.js";
dotenv.config();



const app = express()
app.use(express.json())

app.post("/users", async (req, res) => {
    
    try{
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create(
        {
            name, 
            email, 
            password : hashedPassword
        }
    )
    res.status(201).json(user)

} catch (error) {
    res.status(400).json({ message: error.message })
}}
);
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );
    console.log("JWT Token:", token); // Log the generated token for debugging

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
     console.log("JWT ERROR:", error.name);
  console.log("JWT MESSAGE:", error.message);
    res.status(400).json({
      message: error.message
    });
  }
});
app.get("/profile", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Protected route accessed",
    user: req.user
  });
});
app.get("/", (req, res) => {
    res.send("Hello World")
})


export default app