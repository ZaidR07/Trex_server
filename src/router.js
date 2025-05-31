import { Router } from "express";
import { verifyotp } from "./controllers/admin.js";
import { AdminLogin } from "./controllers/admin.js";
import { AddClient, getcmsclients, UpdateClient } from "./controllers/client.js";


const approuter = Router();

approuter.post("/api/adminlogin",AdminLogin);
approuter.post("/api/verifyotp",verifyotp);


//Client Routes

approuter.post("/api/addclient",AddClient);
approuter.get("/api/getcmsclients",getcmsclients);
approuter.post("/api/updateclient",UpdateClient);




export default approuter;