const addressModel = require("../models/address.model");

const VALID_TYPES = new Set(["Home", "Work", "Other"]);
const STATE_ALIASES = {
  "nct of delhi": "Delhi",
  "nct delhi": "Delhi",
  "orissa": "Odisha",
  "pondicherry": "Puducherry",
};

function pick(body, snake, camel) {
  if (body[snake] !== undefined) return body[snake];
  if (body[camel] !== undefined) return body[camel];
  return undefined;
}

function normalizePhone(value) {
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeState(state) {
  if (!state) return state;
  const alias = STATE_ALIASES[state.trim().toLowerCase()];
  return alias || state.trim();
}

function parseAddressInput(body) {
  const addressTypeRaw = pick(body, "address_type", "addressType");
  return {
    full_name: pick(body, "full_name", "fullName"),
    phone_number: normalizePhone(pick(body, "phone_number", "phoneNumber")),
    alternate_phone_number: normalizePhone(pick(body, "alternate_phone_number", "alternatePhoneNumber")) || "",
    address_line1: pick(body, "address_line1", "addressLine1"),
    address_line2: pick(body, "address_line2", "addressLine2") || "",
    landmark: pick(body, "landmark", "landmark") || "",
    city: pick(body, "city", "city"),
    district: pick(body, "district", "district") || "",
    state: normalizeState(pick(body, "state", "state")),
    postal_code: pick(body, "postal_code", "postalCode") || pick(body, "pincode", "pincode"),
    country: pick(body, "country", "country") || "India",
    latitude: toNumberOrNull(pick(body, "latitude", "latitude")),
    longitude: toNumberOrNull(pick(body, "longitude", "longitude")),
    formatted_address: pick(body, "formatted_address", "formattedAddress") || "",
    address_type: addressTypeRaw && VALID_TYPES.has(addressTypeRaw) ? addressTypeRaw : "Home",
    is_default: Boolean(pick(body, "is_default", "isDefault")),
  };
}

function validateRequired(data) {
  if (!data.full_name || !String(data.full_name).trim()) return "Recipient name is required";
  if (!data.phone_number || !String(data.phone_number).trim()) return "Phone number is required";
  if (!data.address_line1 || !String(data.address_line1).trim()) return "Address line 1 is required";
  if (!data.city || !String(data.city).trim()) return "City is required";
  if (!data.state || !String(data.state).trim()) return "State is required";
  if (!data.postal_code || !String(data.postal_code).trim()) return "PIN code is required";

  const phoneDigits = String(data.phone_number).replace(/\D/g, "");
  if (phoneDigits.length < 10) return "Enter a valid phone number";

  const pin = String(data.postal_code).trim();
  if (!/^\d{6}$/.test(pin)) return "Enter a valid 6-digit PIN code";

  data.full_name = String(data.full_name).trim();
  data.phone_number = String(data.phone_number).trim();
  data.address_line1 = String(data.address_line1).trim();
  data.city = String(data.city).trim();
  data.state = String(data.state).trim();
  data.postal_code = pin;
  return null;
}

function mapNominatim(payload) {
  const addr = payload.address || {};
  const line1Parts = [addr.house_number, addr.road || addr.pedestrian || addr.residential].filter(Boolean);
  const line2Parts = [addr.neighbourhood, addr.suburb, addr.quarter].filter(Boolean);
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || "";
  const district = addr.city_district || addr.county || addr.state_district || "";
  const landmark = addr.amenity || addr.building || addr.tourism || "";

  return {
    addressLine1: line1Parts.join(", "),
    addressLine2: line2Parts.join(", "),
    landmark,
    city,
    district,
    state: normalizeState(addr.state || ""),
    postalCode: addr.postcode || "",
    country: addr.country || "India",
    formattedAddress: payload.display_name || "",
  };
}

async function listAddresses(req, res) {
  try {
    const addresses = await addressModel.listByUser(req.user.userId);
    res.json({ success: true, addresses });
  } catch (error) {
    console.error("Error listing addresses:", error);
    res.status(500).json({ success: false, message: "Failed to fetch addresses" });
  }
}

async function createAddress(req, res) {
  try {
    const data = parseAddressInput(req.body || {});
    const error = validateRequired(data);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const address = await addressModel.create(req.user.userId, data);
    res.status(201).json({ success: true, message: "Address saved", address });
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ success: false, message: "Failed to save address" });
  }
}

async function updateAddress(req, res) {
  try {
    const data = parseAddressInput(req.body || {});
    const error = validateRequired(data);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const address = await addressModel.update(Number(req.params.id), req.user.userId, data);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    res.json({ success: true, message: "Address updated", address });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ success: false, message: "Failed to update address" });
  }
}

async function deleteAddress(req, res) {
  try {
    const address = await addressModel.remove(Number(req.params.id), req.user.userId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    res.json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ success: false, message: "Failed to delete address" });
  }
}

async function setDefaultAddress(req, res) {
  try {
    const address = await addressModel.setDefault(Number(req.params.id), req.user.userId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    res.json({ success: true, message: "Default address updated", address });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ success: false, message: "Failed to set default address" });
  }
}

async function reverseGeocode(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: "Valid latitude and longitude are required" });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: "Coordinates are out of range" });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1`;
    const geoRes = await fetch(url, {
      headers: {
        "User-Agent": "KhushisZone/1.0 (support@khushiszone.com)",
        Accept: "application/json",
      },
    });

    if (!geoRes.ok) {
      return res.status(502).json({ success: false, message: "Geocoding service is temporarily unavailable" });
    }

    const payload = await geoRes.json();
    if (!payload || payload.error) {
      return res.status(404).json({ success: false, message: "No address found for these coordinates" });
    }

    res.json({ success: true, address: mapNominatim(payload) });
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    res.status(502).json({ success: false, message: "Geocoding service is temporarily unavailable" });
  }
}

async function lookupPincode(req, res) {
  try {
    const pincode = String(req.params.pincode || "").trim();
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: "Enter a valid 6-digit PIN code" });
    }

    const pinRes = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      headers: { Accept: "application/json" },
    });
    if (!pinRes.ok) {
      return res.status(502).json({ success: false, message: "PIN lookup is temporarily unavailable" });
    }

    const payload = await pinRes.json();
    const first = Array.isArray(payload) ? payload[0] : null;
    const office = first && Array.isArray(first.PostOffice) ? first.PostOffice[0] : null;
    if (!office) {
      return res.status(404).json({ success: false, message: "No locality found for this PIN code" });
    }

    res.json({
      success: true,
      location: {
        city: office.Block || office.Name || office.Division || "",
        district: office.District || "",
        state: normalizeState(office.State || ""),
        country: office.Country || "India",
        postalCode: pincode,
      },
    });
  } catch (error) {
    console.error("Error looking up pincode:", error);
    res.status(502).json({ success: false, message: "PIN lookup is temporarily unavailable" });
  }
}

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  reverseGeocode,
  lookupPincode,
};
