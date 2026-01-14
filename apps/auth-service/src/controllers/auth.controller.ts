import { NextFunction, Request, Response } from "express"
import prisma from "../../../../packages/libs/prisma"
import { AuthError, ValidationError } from "../../../../packages/error-handler"
import { checkOtpRestrictions, handleForgotPassword, sendOtp, trackOtpRequests, validatedRegistrationData, verifyForgotPasswordOtp, verifyOtp } from "../utils/auth.helper"
import bcrypt from "bcryptjs"
import jwt, { JsonWebTokenError } from "jsonwebtoken"
import { setCookie } from "../utils/cookies/setCookies"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover"
})

// Register a new user
export const userRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body

    console.log(email, name);
    

    const existingUser = await prisma.users.findUnique({ where: { email } })

    if (existingUser) {
      return next(new ValidationError("User already exists with this email"))
    }

    await checkOtpRestrictions(email, next)
    await trackOtpRequests(email, next)
    await sendOtp(name, email, "user-activation-mail")

    res.status(200).json({
      message: "OTP sent to email. Please verify your account"
    })
  } catch (error) {
    return next(error)
  }
}


// verify user with otp
export const verifyUser = async(req:Request, res:Response, next:NextFunction) => {
  try {
    const { email, otp, password, name } = req.body
    if (!email || !otp || !password || !name) {
      return next(new ValidationError("All fields are required"))
    }
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if(existingUser) {
      return next(new ValidationError("User already exists with this email!"))
    }

    await verifyOtp(email, otp, next)

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    })

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user
    })
  } catch (error) {
    return next(error)
  }
}


// login user
export const loginUser = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    if(!email || !password) {
      throw new ValidationError("Email and password are required!")
    }

    const user = await prisma.users.findUnique({
      where: { email }
    })

    if(!user) {
      throw new AuthError("User doesn't exists!")
    }

    // verify password
    const isMatch = await bcrypt.compare(password, user.password!)
    if(!isMatch) {
      throw new AuthError("Invalid email or password")
    }

     res.clearCookie("seller-access-token")
     res.clearCookie("seller-refresh-token")


    // Generate access and refreshtoken
    const accessToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    )

    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    )

    // store the refresh and access token in an httpOnly secure cookies
    setCookie(res, "refresh_token", refreshToken)
    setCookie(res, "access_token", accessToken)

    res.status(200).json({
      message: "Login successful!",
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error) {
    return next(error)
  }
}

// refresh token
export const refreshToken = async (req: any, res: Response, next: NextFunction) => {
  try {
    const refreshToken =
      req.cookies["refresh_token"] || 
      req.cookies["seller-refresh-token"] ||
      req.headers.authorization?.split(" ")[1]

    if (!refreshToken) {
      return new ValidationError("Unauthorized! No refresh token.")
    }
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,  
    ) as { id: string; role: string }

    if (!decoded || !decoded.id || !decoded.role) {
      return new JsonWebTokenError("Forbidden! Invalid refresh token")
    }

    let account;
    if (decoded.role === "user") {
       account = await prisma.users.findUnique({
        where: { id: decoded.id }
      })
    } else if(decoded.role === "seller") {
       account = await prisma.sellers.findUnique({
        where: { id: decoded.id },
        include: { shop: true }
      })
    }
    if (!account) {
      return new AuthError("Forbidden! User/Seller not found")
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    )

    if (decoded.role === "user") {
      setCookie(res, "access_token", newAccessToken)
    } else if(decoded.role === "seller") {
      setCookie(res, "seller-access-token", newAccessToken)
    }
    req.role = decoded.role
    return res.status(201).json({ success: true })
  } catch (error) {
    return next(error)
  }
}

// get logged in user
 export const getUser = async (req: any, res: Response, next: NextFunction) => {
   try {
    const user = req.user
    res.status(201).json({ success: true, user })

   } catch (error) {
     next(error)
   }
 }

// user forgot password
export const userForgotPassword = async(req: Request, res: Response, next: NextFunction) => {
   await handleForgotPassword(req, res, next, "user")
}

// Verify forgot password OTP
export const verifyUserForgotPassword = async(req: Request, res: Response, next: NextFunction) => {
  await verifyForgotPasswordOtp(req, res, next)
}


// Reset user password
export const resetUserPassword = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body
    
    if(!email || !newPassword) {
      throw new ValidationError("Email and new password are required!")
    }

    const user = await prisma.users.findUnique({
      where: { email }
    })

    if (!user) {
      throw new ValidationError("User not found!")
    }

    // compare new password with the existing one
    const isSamePassword = await bcrypt.compare(newPassword, user.password!)
    if(isSamePassword) {
      throw new ValidationError("New Password cannot be the same as the old password!")
    }

    // hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword }
    })

    res.status(200).json({ message: "Password reset successfully" })

  } catch (error) {
    return next(error)
  }
}


// Register a new seller

export const registerSeller = async(req: Request, res: Response, next: NextFunction) => {
   try {
     validatedRegistrationData(req.body, "seller")
     const { name, email } = req.body

     const existingSeller = await prisma.sellers.findUnique({
       where: { email }
     })

     if (existingSeller) {
       throw new ValidationError("Seller already exists with this email!")
     }

     await checkOtpRestrictions(email, next)
     await trackOtpRequests(email, next)
     await sendOtp(name, email, "seller-activation")

     res.status(200).json({
      message: "OTP sent to email. Please verify your seller account"
    })
   } catch (error) {
     next(error)
   }
}

// verify seller with otp
export const verifySeller = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, password, name, phone_number, country } = req.body

    if (!email || !otp || !password || !name || !phone_number || !country) {
      return next(new ValidationError("All fields are required!"))
    }

    const existingSeller = await prisma.sellers.findUnique({
      where: { email }
    })

    if (existingSeller) {
      return next(new ValidationError("Seller already exists with this email!"))
    }

    await verifyOtp(email, otp, next)

    const hashedPassword = await bcrypt.hash(password, 10)
    const seller = await prisma.sellers.create({
      data: {
        name,
        email,
        password: hashedPassword,
        country,
        phone_number
      },
    })

    res.status(201).json({
      message: "Seller registered successfully!",
      seller
    })
  } catch (error) {
    
  }
}


// Create a new shop
export const createShop = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      bio,
      address,
      opening_hours,
      website,
      category,
      sellerId
    } = req.body

    if (
      !name||
      !bio||
      !address||
      !opening_hours||
      !website||
      !category||
      !sellerId
    ) {
      return next(new ValidationError("All fields are required!"))
    }

    const shopData: any = {
      name,
      bio,
      address,
      opening_hours,
      website,
      category,
      sellerId
    }

    if (website && website.trim() !== "") {
      shopData.website = website
    }

    const shop = await prisma.shops.create({
      data: shopData
    })
    res.status(201).json({
      success: true,
      shop,
    })
  } catch (error) {
    next(error)
  }
}

// create stripe connect account link
export const createStripeConnectLink = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { sellerId } = req.body

    if (!sellerId) {
      return next(new ValidationError("Seller ID is required"))
    }
    const seller = await prisma.sellers.findUnique({
      where: {
        id: sellerId
      }
    })

    if (!seller) {
      return next(new ValidationError("Seller is not available with this id!"))
    }

    const account = await stripe.accounts.create({
      type: "express",
      email: seller?.email,
      country: "GB",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    })

    await prisma.sellers.update({
      where: { id: sellerId },
      data: {
        stripeId: account.id
      }
    })

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `http://localhost:3000/success`,
      return_url: `http://localhost:3000/success`,
      type: "account_onboarding"
    })

    res.json({ url: accountLink.url})
  } catch (error) {
    return next(error)
  }
}


export const loginSeller = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next(new ValidationError("Email and password are required"))
    }

    const seller = await prisma.sellers.findUnique({
      where: { email }
    })
    if (!seller) {
      return next(new ValidationError("Invalid email or password!"))
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, seller.password)
    if (!isMatch) {
      return next(new ValidationError("Invalid email or password!"))
    }

    res.clearCookie("access_token")
    res.clearCookie("refresh_token")

    // Generate access and refresh tokens
    const accessToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    )

    const refreshToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    )

    // store access and refresh token
    setCookie(res, "seller-refresh-token", refreshToken)
    setCookie(res, "seller-access-token", accessToken)

    res.status(200).json({
      message: "Login successful",
      seller: { id: seller.id, email: seller.email, name: seller.name }
    })
  } catch (error) {
    return next(error)
  }
}

// get logged in seller
export const getSeller = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const seller = req.seller
    res.status(200).json({
      success: true,
      seller
    })
  } catch (error) {
    next(error)
  }
}


export const sample = async(req: Request, res: Response, next: NextFunction) => {

}