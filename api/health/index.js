module.exports = async function (context, _req) {
  context.res = {
    status: 200,
    jsonBody: { ok: true, configured: true }
  };
};
