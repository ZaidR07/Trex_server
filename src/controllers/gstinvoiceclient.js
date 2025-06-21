import { logger } from "../../logger.js";
import mongoose from "mongoose";
import { encryptData } from "../../util/Data_protection.js";

export const AddGstInvoiceClient = async (req, res) => {
  try {
    const data = req.body.formData;
    const client_id = req.body.client_id; // Check for client_id to determine add or update

    if (!data) {
      logger.error("Required Fields are Missing");
      return res.status(400).json({
        message: "Required Fields are Missing",
      });
    }

    const db = mongoose.connection;

    // Check if the client already exists with the provided email (only for add operation)
    if (!client_id) {
      const checkclient = await db
        .collection("Gstclients")
        .findOne({ email: data.email });

      if (checkclient) {
        logger.error("Another Client is Registered with this email");
        return res.status(409).json({
          message: "Another Client is Registered with this email",
        });
      }
    }

    data.admin_id = data.email;

    let newClientId;
    if (!client_id) {
      // Generate client_id for new client
      const lastClient = await db.collection("clients").findOne(
        {},
        {
          sort: { client_id: -1 },
          projection: { client_id: 1 },
        }
      );

      if (lastClient && lastClient.client_id) {
        newClientId = parseInt(lastClient.client_id) + 1;
      } else {
        newClientId = 100001;
      }
      data.client_id = newClientId;
    } else {
      // Use the existing client_id for update
      data.client_id = client_id;
    }

    data.amount = parseInt(data.amount);
    data.payment = parseInt(data.payment);
    data.balance = parseInt(data.balance);

    let result;
    if (!client_id) {
      // Insert new client
      delete data.createdAt; 
      result = await db.collection("clients").insertOne(data);
    } else {
      // Update existing client
      delete data._id ;
      data.updatedAt = new Date();

      

      result = await db.collection("clients").updateOne(
        { client_id: client_id },
        { $set: data }
      );
    }

    // Switch to the client-specific database
    const clientDb = db.useDb(data.dbname, { useCache: true });

    // Only create admin if it's a new client
    if (!client_id) {
      await clientDb.collection("admin").insertOne({
        email: data.email,
        password: encryptData("123456", process.env.KEY),
        rank: "1",
      });
    }

    if (result.insertedId || result.modifiedCount > 0) {
      logger.info(
        `Client ${client_id ? "updated" : "added"} with ID: ${data.client_id}`
      );
      return res.status(client_id ? 200 : 201).json({
        message: `Client ${client_id ? "updated" : "added"} successfully`,
        client_id: data.client_id,
        data: data,
      });
    } else {
      throw new Error("Failed to insert or update client");
    }
  } catch (error) {
    logger.error("Error adding/updating client:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getgstclients = async (req, res) => {
  try {
    const {db} = req.query;
    if (!db) {
      logger.error("Database name is required");
      return res.status(400).json({
        message: "Database name is required",
      });
    }
    const database = mongoose.connection;

    const clientdb = database.useDb(db, { useCache: true });
    

    const clients = await clientdb.collection("clients").find({}).toArray();

    if (clients?.length < 0) {
      logger.error("No clients Found");
      return res.status(200).json({
        message: "No clients Found",
      });
    }

    return res.status(200).json({
      payload: clients,
      message: "Clients fetched Successfull",
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};