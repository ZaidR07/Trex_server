import mongoose from "mongoose";
import { logger } from "../../logger.js";
import { encryptData } from "../../util/Data_protection.js";

export const AddClient = async (req, res) => {
  try {
    const data = req.body.formData;

    if (!data) {
      logger.error("Required Fields are Missing");
      return res.status(400).json({
        message: "Required Fields are Missing",
      });
    }

    const db = mongoose.connection;

    const checkclient = await db
      .collection("clients")
      .findOne({ email: data.email });

    if (checkclient) {
      logger.error("Another Client is Registered with this email");
      return res.status(409).json({
        message: "Another Client is Registered with this email",
      });
    }

    data.admin_id = data.email;

    // Generate client_id by finding the last client and incrementing
    const lastClient = await db.collection("clients").findOne(
      {},
      {
        sort: { client_id: -1 },
        projection: { client_id: 1 },
      }
    );

    let client_id;
    if (lastClient && lastClient.client_id) {
      // If there are existing clients, increment the last client_id
      client_id = parseInt(lastClient.client_id) + 1;
    } else {
      // If no clients exist, start with 100001
      client_id = 100001;
    }

    data.client_id = client_id;
    data.amount = parseInt(data.amount);
    data.payment = parseInt(data.payment);
    data.balance = parseInt(data.balance);
    data.createdAt = new Date();

    // Insert the new client
    const result = await db.collection("clients").insertOne(data);

    // Switch to the client-specific database
    const clientDb = db.useDb(data.dbname, { useCache: true });

    await clientDb.collection("admin").insertOne({
      admin_id : data.email,
      password: encryptData("123456", process.env.KEY),
      rank: "1",
    });

    if (result.insertedId) {
      logger.info(`New client added with ID: ${client_id}`);
      return res.status(201).json({
        message: "Client added successfully",
        client_id: client_id,
        data: data,
      });
    } else {
      throw new Error("Failed to insert client");
    }
  } catch (error) {
    logger.error("Error adding client:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const UpdateClient = async (req, res) => {
  try {
    const data = req.body.data;
    const clientId = req.body.client_id || req.params.client_id; // Get client_id from body or params

    if (!data || !clientId) {
      logger.error("Required Fields are Missing");
      return res.status(400).json({
        message:
          "Required Fields are Missing (formData and client_id required)",
      });
    }

    const db = mongoose.connection.db;

    // Find the existing client
    const existingClient = await db
      .collection("clients")
      .findOne({ client_id: parseInt(clientId) });

    if (!existingClient) {
      logger.error("Client not found");
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // If email is being updated, check if another client already has this email
    if (data.email && data.email !== existingClient.email) {
      const checkclient = await db.collection("clients").findOne({
        email: data.email,
        client_id: { $ne: parseInt(clientId) }, // Exclude current client
      });

      if (checkclient) {
        logger.error("Another Client is Registered with this email");
        return res.status(409).json({
          message: "Another Client is Registered with this email",
        });
      }
    }

    // Build update object with only non-null/non-undefined fields
    const updateData = {};

    // List of allowed fields to update
    const allowedFields = [
      "dbname",
      "email",
      "number",
      "classesname",
      "date",
      "amount",
      "payment",
      "balance",
      "emailPack",
      "smsPack",
    ];

    // Only include fields that are not null, undefined, or empty string
    allowedFields.forEach((field) => {
      if (
        data[field] !== null &&
        data[field] !== undefined &&
        data[field] !== ""
      ) {
        updateData[field] = data[field];
      }
    });

    // Convert numeric fields to proper types if they exist in updateData
    if (updateData.amount !== undefined) {
      updateData.amount = parseInt(updateData.amount);
    }
    if (updateData.payment !== undefined) {
      updateData.payment = parseInt(updateData.payment);
    }
    if (updateData.balance !== undefined) {
      updateData.balance = parseInt(updateData.balance);
    }
    if (updateData.smsPack !== undefined) {
      updateData.smsPack = parseInt(updateData.smsPack);
    }
    if (updateData.emailPack !== undefined) {
      updateData.emailPack = parseInt(updateData.emailPack);
    }

    // Update admin_id if email is being updated
    if (updateData.email) {
      updateData.admin_id = updateData.email;
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 1) {
      // Only updatedAt
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    // Update the client
    const result = await db
      .collection("clients")
      .updateOne({ client_id: parseInt(clientId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      logger.error("Client not found for update");
      return res.status(404).json({
        message: "Client not found",
      });
    }

    if (result.modifiedCount === 0) {
      logger.info("No changes made to the client");
      return res.status(200).json({
        message: "No changes were necessary",
        client_id: parseInt(clientId),
      });
    }

    // Get the updated client data
    const updatedClient = await db
      .collection("clients")
      .findOne({ client_id: parseInt(clientId) });

    logger.info(`Client updated successfully with ID: ${clientId}`);
    return res.status(200).json({
      message: "Client updated successfully",
      client_id: parseInt(clientId),
      updatedFields: Object.keys(updateData).filter(
        (key) => key !== "updatedAt"
      ),
      data: updatedClient,
    });
  } catch (error) {
    logger.error("Error updating client:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getcmsclients = async (req, res) => {
  try {
    const db = mongoose.connection;

    const clients = await db.collection("clients").find({}).toArray();

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
