const { getService } = require("../shared/getService");

module.exports = async function (context, _req) {
  try {
    const service = getService();
    const result = await service.getPlayers();

    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
