const express = require("express");
const IrmaBackend = require("@privacybydesign/irma-backend");
const IrmaJwt = require("@privacybydesign/irma-jwt");
const app = express();
const cors = require("cors");
const util = require("util");
const fs = require("fs");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

let config;

const init = async () => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set");
  }

  try {
    // read the config file only once each session
    if (config === undefined) {
      let configFile = "config.json";
      if (process.env.NODE_ENV === "production") {
        configFile = "config.prod.json";
      }
      const json = await util.promisify(fs.readFile)(configFile, "utf-8");
      console.log("Using config", json);
      config = JSON.parse(json);
    }

    app.use(express.json());

    app.get("/start", cors(), function () {
      console.log("signing started");
    });
    app.get("/config", cors(), getConfig);
    app.get("/health", cors(), health);

    if (
      process.env.NODE_ENV === "acceptance" ||
      process.env.NODE_ENV === "production"
    ) {
      app.use(express.static(config.docroot, { index: false }));
      app.get("*", secured, function (req, res) {
        res.sendFile(path.join(__dirname, config.docroot, "index.html"));
      });
    } else {
      console.log("Using proxy to the react app for development");
      // proxy the root to the react app container in development mode
      app.use(
        "/",
        createProxyMiddleware({
          target: "http://localhost:8080",
          changeOrigin: true,
        })
      );
    }

    app.listen(config.port, () =>
      console.log(
        `Di-demo backend running in ${
          process.env.NODE_ENV || "development"
        } mode.`
      )
    );
  } catch (e) {
    console.log(e);
    error(e);
  }
};

const health = async (req, res) => {
  return res.status(200).send("Healthy!");
};

const getConfig = async (req, res) => {
  config.environment = process.env.NODE_ENV;
  console.log("get config", JSON.stringify(config));
  res.json(config);
};

const error = (e, res) => {
  const jsonError = JSON.stringify(e);
  console.error("Node error", jsonError);
  if (res) {
    res.json({ error: jsonError });
  }
};

init();
// app.use('/', createProxyMiddleware({ target: 'http://www.example.org', changeOrigin: true }));

// app.listen(3000);
