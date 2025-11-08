import Location from "../models/locationModel.js";

// @desc Save user location
// @route POST /api/location
export const saveLocation = async (req, res) => {
  try {
    const { lat, lon } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ message: "Latitude and Longitude required" });
    }

    const location = new Location({ latitude: lat, longitude: lon });
    await location.save();

    res.status(200).json({ message: "Location saved successfully", location });
  } catch (error) {
    console.error(error);
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
