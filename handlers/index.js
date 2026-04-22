const startHandler = require("./start");
const scanHandler = require("./scan");
const fileHandler = require("./file");
const historyHandler = require("./history");
const helpHandler = require("./help");

function registerHandlers(bot) {
  startHandler(bot);
  helpHandler(bot);
  historyHandler(bot);
  fileHandler(bot);
  scanHandler(bot);  // must be last - catches all text messages
}

module.exports = registerHandlers;
