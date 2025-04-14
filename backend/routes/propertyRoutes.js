import express from "express";
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../controllers/propertyController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();


router.get("/all", getAllProperties);


router.get("/:id", getPropertyById);


router.post("/create", isAuthenticated, createProperty);



router.put("/update/:id", isAuthenticated, updateProperty);


router.delete("/delete/:id", isAuthenticated, deleteProperty);

export default router;
