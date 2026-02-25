module.exports = async function (context, _req) {
  context.res = {
    status: 200,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ ok: true, configured: true })
  };
};
