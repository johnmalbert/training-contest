const { SheetsService } = require("./sheetsService");

let instance;

function getService() {
  if (!instance) {
    instance = new SheetsService();
  }

  return instance;
}

module.exports = { getService };
