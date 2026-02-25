const { getService } = require("../shared/getService");

module.exports = async function (context, _req) {
  try {
    const service = getService();
    const result = await service.getPlayers();

    context.res = {
      status: 200,
      jsonBody: result
    };
  } catch (error) {
    context.res = {
      status: 500,
      jsonBody: {
        error: error.message
      }
    };
  }
};
