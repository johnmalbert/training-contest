const { getService } = require("../shared/getService");

module.exports = async function (context, req) {
  try {
    const service = getService();
    const result = await service.upsertPlayerEntry(req.body || {});

    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ ok: true, result })
    };
  } catch (error) {
    if (error.code === "DATE_ALREADY_POPULATED") {
      context.res = {
        status: 409,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          error: error.message,
          code: error.code,
          suggestion: error.suggestion ?? null
        })
      };
      return;
    }

    context.res = {
      status: 400,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
