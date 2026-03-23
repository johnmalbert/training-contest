const { getService } = require("../shared/getService");

module.exports = async function (context, req) {
  const player = String(req.query?.player || "").trim();
  const limit = Number(req.query?.limit || 3);

  if (!player) {
    context.res = {
      status: 400,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        error: "Query parameter 'player' is required."
      })
    };
    return;
  }

  try {
    const service = getService();
    const workouts = await service.getRecentPlayerWorkouts(player, limit);

    if (!workouts.length) {
      context.res = {
        status: 404,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          error: `No workouts found for ${player}.`,
          code: "NO_WORKOUTS_FOUND"
        })
      };
      return;
    }

    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ workouts })
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
