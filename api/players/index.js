const { getService } = require("../shared/getService");

module.exports = async function (_context, _req) {
  try {
    const service = getService();
    const result = await service.getPlayers();

    return {
      status: 200,
      jsonBody: result
    };
  } catch (error) {
    return {
      status: 500,
      jsonBody: {
        error: error.message
      }
    };
  }
};
