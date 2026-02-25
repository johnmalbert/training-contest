const { getService } = require("../shared/getService");

module.exports = async function (context, req) {
  try {
    const service = getService();
    const limit = Number(req.query?.limit || 60);
    const dates = await service.getRecentDates(limit);

    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ dates })
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
