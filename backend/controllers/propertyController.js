import Property from '../models/propertyModel.js';
import ErrorHandler from '../middlewares/error.js';

// Create property
export const createProperty = async (req, res, next) => {
  try {
    const { title, description, price, address, images } = req.body;

    if (!title || !price) {
      return next(new ErrorHandler("Title and Price are required", 400));
    }

    const property = new Property({
      title,
      description,
      price,
      address,
      images,
      listedBy: req.user._id,
    });

    await property.save();
    res.status(201).json({
      success: true,
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    next(error);
  }
};

// Get all properties
export const getAllProperties = async (req, res, next) => {
  try {
    const properties = await Property.find().populate('listedBy', 'name email');
    res.status(200).json({
      success: true,
      properties,
    });
  } catch (error) {
    next(error);
  }
};

// Get single property by ID
export const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate('listedBy', 'name email');
    if (!property) {
      return next(new ErrorHandler("Property not found", 404));
    }
    res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    next(error);
  }
};

// Update property (only by owner)
export const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new ErrorHandler("Property not found", 404));
    }

    if (property.listedBy.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("Unauthorized to update this property", 403));
    }

    Object.assign(property, req.body);
    await property.save();

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    next(error);
  }
};

// Delete property (only by owner)
export const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new ErrorHandler("Property not found", 404));
    }

    if (property.listedBy.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("Unauthorized to delete this property", 403));
    }

    await property.deleteOne();
    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
