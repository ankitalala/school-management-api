const db = require("../config/db");

// Haversine Formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371; // in km

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

// POST /addSchool
const addSchool = (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validation
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Valid school name is required"
    });
  }

  if (!address || typeof address !== "string" || !address.trim()) {
    return res.status(400).json({
      success: false,
      message: "Valid school address is required"
    });
  }

  if (
    latitude === undefined ||
    longitude === undefined ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid latitude and longitude are required"
    });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      message: "Latitude must be between -90 and 90"
    });
  }

  if (lon < -180 || lon > 180) {
    return res.status(400).json({
      success: false,
      message: "Longitude must be between -180 and 180"
    });
  }

  const sql =
    "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";

  db.query(sql, [name.trim(), address.trim(), lat, lon], (err, result) => {
    if (err) {
      console.error("Insert Error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to add school",
        error: err.message
      });
    }

    res.status(201).json({
      success: true,
      message: "School added successfully",
      data: {
        id: result.insertId,
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lon
      }
    });
  });
};

// GET /listSchools?latitude=xx&longitude=yy
const listSchools = (req, res) => {
  const { latitude, longitude } = req.query;

  if (
    latitude === undefined ||
    longitude === undefined ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid user latitude and longitude are required"
    });
  }

  const userLat = parseFloat(latitude);
  const userLon = parseFloat(longitude);

  if (userLat < -90 || userLat > 90) {
    return res.status(400).json({
      success: false,
      message: "Latitude must be between -90 and 90"
    });
  }

  if (userLon < -180 || userLon > 180) {
    return res.status(400).json({
      success: false,
      message: "Longitude must be between -180 and 180"
    });
  }

  const sql = "SELECT * FROM schools";

  db.query(sql, (err, schools) => {
    if (err) {
      console.error("Fetch Error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch schools",
        error: err.message
      });
    }

    const sortedSchools = schools
      .map((school) => {
        const distance = calculateDistance(
          userLat,
          userLon,
          school.latitude,
          school.longitude
        );

        return {
          ...school,
          distance_km: Number(distance.toFixed(2))
        };
      })
      .sort((a, b) => a.distance_km - b.distance_km);

    res.status(200).json({
      success: true,
      message: "Schools fetched successfully",
      user_location: {
        latitude: userLat,
        longitude: userLon
      },
      count: sortedSchools.length,
      data: sortedSchools
    });
  });
};

module.exports = {
  addSchool,
  listSchools
};