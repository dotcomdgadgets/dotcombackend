import axios from "axios";
import Location from "../models/locationModel.js";

// @desc Save user location with address
// @route POST /api/location
export const saveLocation = async (req, res) => {
  try {
    const { lat, lon } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ message: "Latitude and Longitude required" });
    }

    // ✅ Fetch address from OpenCage API
    const apiKey = process.env.OPENCAGE_API_KEY;
    const geoUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}`;

    const response = await axios.get(geoUrl);
    const formattedAddress = response.data.results[0]?.formatted || "Unknown location";

    // ✅ Save location + address
    const location = new Location({
      latitude: lat,
      longitude: lon,
      address: formattedAddress,
    });

    await location.save();

    res.status(200).json({
      message: "Location saved successfully",
      location,
    });
  } catch (error) {
    console.error("Error saving location:", error.message);
    res.status(500).json({ message: "Error saving location" });
  }
};

// ✅ NEW: Get all locations
export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};
