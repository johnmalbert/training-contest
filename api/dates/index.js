const { getService } = require("../shared/getService");

module.exports = async function (_context, req) {
  try {
    const service = getService();
    const limit = Number(req.query?.limit || 60);
    const dates = await service.getRecentDates(limit);

    return {
      status: 200,
      jsonBody: { dates }
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
