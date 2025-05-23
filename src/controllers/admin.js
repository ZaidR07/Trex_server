import mongoose from "mongoose";
import { logger } from "../../logger.js";
import { decryptData } from "../../util/Data_protection.js";

const key = process.env.KEY;

import { Resend } from "resend";

// re_ccuAZtfq_qWsMFDrWjLSwX1vt6qm5GFCp

const resend = new Resend("re_ccuAZtfq_qWsMFDrWjLSwX1vt6qm5GFCp");

const sendotp = async (email) => {
  try {
    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { data, error } = await resend.emails.send({
      from: "T-REX Infotech <no-reply@t-rexinfotech.in>",
      to: [email],
      subject: "Your OTP Code",
      html: `<p>Your OTP is: <strong>${otp}</strong>. It is valid for 2 minutes.</p>`,
    });

    if (error) {
      throw new Error({ message: "Failed to send OTP", error });
    }

    return otp;
  } catch (error) {
    console.error("Send OTP Error:", error);
    throw new Error({ message: "Internal Server Error" });
  }
};

export const adduser = async (req, res) => {
  try {
    // Connect to the database
    const db = mongoose.connection.db;
    const { name, email, mobile, password } = req.body.payload; // Extract data from request

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "Some Fields are missing" });
    }

    // Function to generate user ID (random 6-digit number + timestamp)
    const generateUserId = () => {
      const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
      return `${randomNum}-${Date.now()}`;
    };

    const userid = generateUserId();

    const existingUser = await db.collection("users").findOne({
      $or: [{ email: email }, { mobile: mobile }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User Already exists" });
    }

    const otp = await sendotp(email);

    await db.collection("users").insertOne({
      name,
      email,
      mobile,
      user: userid,
      password,
      createdAt: new Date(),
      otp: otp,
      otpGeneratedAt: new Date(),
    });

    return res.status(200).json({ message: "opd generated successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const db = mongoose.connection.db;
    const admin = await db
      .collection("login")
      .findOne({ email });


    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (!admin.otp || !admin.otpGeneratedAt) {
      return res
        .status(400)
        .json({ message: "No OTP found. Please request a new one." });
    }

    // Check if OTP has expired (10 minutes expiry)
    const otpAge =
      (Date.now() - new Date(admin.otpGeneratedAt).getTime()) / 1000; // in seconds
    if (otpAge > 120) {
      return res
        .status(410)
        .json({ message: "OTP expired. Please request a new one." });
    }

    // Match OTP
    if (admin.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // ✅ Success: Clear OTP and mark as verified
    await db.collection("admin").updateOne(
      { email },
      {
        $unset: { otp: "", otpGeneratedAt: "" },
        $set: { isVerified: true }, // optional
      }
    );

    return res
      .status(200)
      .json({ message: "OTP verified successfully", name: admin.name });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// export const SendLoginOtp = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const db = mongoose.connection.db;

//     if (!email || typeof email !== "string") {
//       return res.status(400).json({
//         message: "Invalid or missing email",
//       });
//     }

//     const checkuser = await db.collection("users").findOne({
//       email: email,
//     });

//     if (!checkuser) {
//       return res.status(404).json({
//         message: "No user Found with this email",
//       });
//     }

//     const otp = await sendotp(email);

//     if (!otp) {
//       return res.status(500).json({
//         message: "Unable to generate OTP, please try again later",
//       });
//     }

//     // Optional: remove previous OTPs for the same email
//     await db.collection("login").deleteMany({ email });

//     // Insert new OTP record
//     await db.collection("login").insertOne({
//       email,
//       otp,
//       otpGeneratedAt: new Date(),
//     });

//     return res.status(200).json({
//       message: "OTP generated successfully",
//     });
//   } catch (error) {
//     console.error("Error in SendLoginOtp:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// Login function

export const AdminLogin = async (req, res) => {
  try {
    const decrpteddata = decryptData(req.body, key);

    const { email } = decrpteddata;

    // Validate required fields
    if (!email) {
      logger.error("Required fields are missing");
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }
    const db = mongoose.connection.db;

    const admin = db.collection("admin").findOne({ email });

    if (!admin) {
      return res.status(404).json({
        message: "Invalid Username",
      });
    }

    const otp = await sendotp(email);

    await db.collection("login").insertOne({
      email,
      otp,
      otpGeneratedAt: new Date(),
    });

    return res.status(200).json({
      message: `Otp sent to ${email}`,
    });
  } catch (error) {
    logger.error(`Login failed: ${error.message}`);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
