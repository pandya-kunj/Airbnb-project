import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import {  User } from "../models/userModel.js";
import {sendEmail} from "../utils/sendEmail.js";
import twilio from "twilio";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);


export const register = catchAsyncError(async (req, res, next) => {
    try{
        const { name, email, phone, password, verificationMethod } = req.body;
        if( !name || !email || !phone || !password || !verificationMethod ) {
            return next (new ErrorHandler("All fields are required",400));
        }
        function validatePhoneNumber(phone) {
            const phoneRegex = /^(?:\+91)?[6789]\d{9}$/;
            return phoneRegex.test(phone);
        }

        if(!validatePhoneNumber(phone)){
            return next(new ErrorHandler("invalid phone number.",400));
        }

        const existingUser = await User.findOne({
            $or:[
                {
                    email,
                    accountVerified: true,
                },
                {
                    phone,
                    accountVerified: true,
                },
            ],
        });

        if(existingUser) {
            return next(new ErrorHandler("Phone or Email is already used.",400));
        }

        const registrationAttemptsByUser = await User.find({
            $or: [
                { phone, accountVerified: false},
                { email, accountVerified: false},
            ]
        });

        if(registrationAttemptsByUser.length > 3) {
            return next(
                new ErrorHandler (
                    "You have execeeded the maximum number of attempts (3). Please try again after an hour.",
                400
            )
        );
        }

        const userData = {
            name,
            email,
            phone,
            password,
        };

        const user = await User.create(userData);
        const verificationCode = await user.generateVerificationCode();
        await user.save();
        sendVerificationCode(verificationMethod, verificationCode, name,  email, phone, res);
   

    }catch (error) {
        next(error);
    }
 } );



 async function sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res)
  { try {
    if(verificationMethod == "email"){
        const message = generateEmailTemplate(verificationCode);
        sendEmail({email, subject: "Your verification code", message});
        res.status(200).json({
            success: true,
            message: `Verification email successfully send to ${name}`
        });
    }else if (verificationMethod === "phone") {
        const verificationCodeWithSpace = verificationCode
        .toString()
        .split("")
        .join(" ");
        await client.calls.create({
            twiml: `<Response><Say>Your verification code is ${verificationCodeWithSpace}</Say></Response>`,
            // body: `Your verification code is: ${verificationCode}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
        });
         res.status(200).json({
            success: true,
            message: `OTP sent.`
        });
    } else {
        return res.status(500).json({
            success: false,
            message:"invalid verification method."
        });
    }
  } catch (error) {
    return res.status(500).json({
        success: false,
        message:"Verification code failed to send.",
        error: error.message || error,
        
        
    });
  }


    

 }


 function generateEmailTemplate(verificationCode) {
     return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #ccc; border-radius: 10px; background-color: #f9f9f9;">
      <h2 style="color: #2F855A; text-align: center;">Email Verification</h2>
      <p style="font-size: 16px; color: #333;">Hello,</p>
      <p style="font-size: 16px; color: #333;">To verify your email address, please use the following verification code:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 28px; font-weight: bold; color: #2F855A; padding: 12px 24px; border: 2px dashed #2F855A; border-radius: 8px;">
          ${verificationCode}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">This code is valid for 10 minutes. If you didn’t request this code, you can safely ignore this email.</p>
      <footer style="margin-top: 30px; text-align: center; font-size: 14px; color: #888;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px;">This is an automated message. Please do not reply.</p>
      </footer>
    </div>
  `;
 }



 export const verifyOTP = catchAsyncError(async (req, res, next) => {

    const{ email, otp, phone }= req.body; 


    function validatePhoneNumber(phone) {
        const phoneRegex = /^(?:\+91)?[6789]\d{9}$/;
        return phoneRegex.test(phone);
    }

    if(!validatePhoneNumber(phone)){
        return next(new ErrorHandler("invalid phone number.",400));
    }

    try{
        const userAllEntries = await User.find({
            $or: [
                {
                    email, accountVerified : false
                },{
                    phone, accountVerified: false,
                },
            ],
        }).sort({ createdAt: - 1});


        if(!userAllEntries){
            return next(new ErrorHandler("user not found.",400));
      
        }

            let user;

            if(userAllEntries.length > 1){
                user = userAllEntries[0];

                await User.deleteMany({
                    _id: {$ne: user._id},
                    $or: [
                        {phone, accountVerified: false},
                        {email, accountVerified: false},
                    ],
                })
            } else{
                user = userAllEntries[0];
            }

            if(user.verificationCode !== Number(otp)) {
                return next(new ErrorHandler("Invalid OTP.",400));
            }

            const currentTime = Date.now();
            const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();
            console.log(currentTime);
            console.log(verificationCodeExpire);
            if(currentTime > verificationCodeExpire){
                return next(new ErrorHandler("OTP expired.",400));
            }


            user.accountVerified = true;
            user.verificationCode = null;
            user.verificationCodeExpire= null;
            await user.save({validateModifiedOnly: true });


            sendToken(user, 200, "Account Verified.", res);
    } catch(error) {
        // console.error("OTP verification error:", error);
         return next (new ErrorHandler("Internal Server Error.", 500))
    }

 });


 export const login = catchAsyncError(async (req, res, next) => {
    const {email, password} = req.body;
    if(!email || !password){
        return next(new ErrorHandler("Email and password are required", 400));

    }
    const user = await User.findOne({email, accountVerified: true}).select("+password");
    if(!user){
        return next(new ErrorHandler("Invalid email or password.",400));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched){
       return next(new ErrorHandler("Invalid email or password.",400));
    }
    sendToken(user, 200, "User logged in successfully.",res);
 });



 export const logout = catchAsyncError(async (req, res, next) =>{
    res.status(200).cookie("token" , "", {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).json({
        success: true,
        message: "Logged out successfully"
    });
 });


 export const getUSer = catchAsyncError( async (req, res, next)=>{
    const user = req.user;
    res.status(200).json({
        success:true,
        user,
    });
 });


 export const forgotPassword = catchAsyncError(async(req, res, next)=> {
    const user = await User.findOne({email: req.body.email, accountVerified: true});
    if(!user){
        return next(new ErrorHandler("User not found.",404));

    }
    const resetToken = user.generateResetPasswordToken();
    await user.save({validateBeforeSave:false });
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;


    const message = `Your reset Password Token is:- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it.`;

    try {
        sendEmail({email: user.email, subject:"MERN AUTHENTICATION APP RESET PASSWORD", message,});
        res.status(200).json({
            success:true,
            message:`email sent to ${user.email} sucessfully.`,
        })
    } catch (error) {
        user.resetPasswordToken=undefined;
        user.resetPasswordExpire=undefined;
        await user.save({validateBeforeSave:false });
        return next(new ErrorHandler(error.message ? error.message  : "can't send reset password token.",500));
    }
 });


 export const resetPassword = catchAsyncError(async (req,res,next)=>{
    const { token} = req.params;
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()},
    });
    if(!user){
        return next(new ErrorHandler("Reset password token is invalid or has been expired.",400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password & Confirm Password Do Not Match.",400));
    }

    user.password = await req.body.password;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;
    await user.save();

    sendToken(user, 200, "Reset Password Successfully.",res);
 });