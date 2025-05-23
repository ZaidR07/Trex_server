import { Router } from "express";
import { verifyotp } from "./controllers/admin.js";
import { AdminLogin } from "./controllers/admin.js";


const approuter = Router();

approuter.post("/api/adminlogin",AdminLogin);
approuter.post("/api/verifyotp",verifyotp);




export default approuter;