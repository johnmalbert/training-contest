const { getService } = require("../shared/getService");

module.exports = async function (_context, req) {
  try {
    const service = getService();
    const result = await service.upsertPlayerEntry(req.body || {});

    return {
      status: 200,
      jsonBody: { ok: true, result }
    };
  } catch (error) {
    if (error.code === "DATE_ALREADY_POPULATED") {
      return {
        status: 409,
        jsonBody: {
          error: error.message,
          code: error.code,
          suggestion: error.suggestion ?? null
        }
      };
    }

    return {
      status: 400,
      jsonBody: {
        error: error.message
      }
    };
  }
};
