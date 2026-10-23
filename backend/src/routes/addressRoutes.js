const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const addressController = require("../controllers/address.controller");

const router = express.Router();

router.use(authenticateToken);

router.get("/geocode", addressController.reverseGeocode);
router.get("/pincode/:pincode", addressController.lookupPincode);
router.get("/", addressController.listAddresses);
router.post("/", addressController.createAddress);
router.put("/:id", addressController.updateAddress);
router.patch("/:id/default", addressController.setDefaultAddress);
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
