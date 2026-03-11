const { getService } = require("../shared/getService");

module.exports = async function (context, req) {
  try {
    const service = getService();
    const limit = Number(req.query?.limit || 3);
    const leaders = await service.getTopLeaders(limit);

    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ leaders })
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
