import { Router } from "express";
import { verifyotp } from "./controllers/admin.js";
import { AdminLogin } from "./controllers/admin.js";
import { AddClient, getcmsclients, UpdateClient } from "./controllers/cmsclient.js";
import { generateInvoice } from "./controllers/invoice.js";
import { AddGstInvoiceClient } from "./controllers/gstinvoiceclient.js";
import { getgstclients } from "./controllers/gstinvoiceclient.js";

const approuter = Router();

approuter.post("/api/adminlogin",AdminLogin);
approuter.post("/api/verifyotp",verifyotp);


//Client Routes

approuter.post("/api/addclient",AddClient);
approuter.get("/api/getcmsclients",getcmsclients);
approuter.post("/api/updateclient",UpdateClient);


// gst client routes 
approuter.post("/api/addupdategstinvoiceclient",AddGstInvoiceClient);
approuter.get("/api/getgstinvoiceclients",getgstclients);
// approuter.post("/api/updateclient",UpdateClient);

// invoice routes
approuter.post('/api/generateinvoice',generateInvoice )


export default approuter;