import axios from "axios";
import Location from "../models/locationModel.js";

export const saveLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and Longitude required",
      });
    }

    const location = new Location({
      latitude,
      longitude,
      address, // ✅ structured object
    });

    await location.save();

    res.status(200).json({
      message: "Location saved successfully",
      location,
    });
  } catch (error) {
    console.error("❌ Error saving location:", error.message);
    res.status(500).json({ message: "Error saving location" });
  }
};



export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};
