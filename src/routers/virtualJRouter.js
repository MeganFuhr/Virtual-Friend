const express = require("express");

const virtualJRouter = express.Router();
virtualJRouter.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect("/");
  }
});

virtualJRouter.route("/").get((req, res) => {
  //ejs looks in views.
  res.render("virtual-j");
});

module.exports = virtualJRouter;
