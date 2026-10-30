const express = require("express");
const router = express.Router();
const {
  subscribeUser,
  unsubscribeUser,
} = require("../controllers/newsletter.controller");

router.post("/subscribe", subscribeUser);
router.post("/unsubscribe", unsubscribeUser);

module.exports = router;
