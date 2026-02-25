module.exports = async function (_context, _req) {
  return {
    status: 200,
    jsonBody: { ok: true, configured: true }
  };
};
