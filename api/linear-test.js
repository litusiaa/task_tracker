const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const apiKey = (process.env.LINEAR_API_KEY || '').trim();
    const teamId = (process.env.LINEAR_TEAM_ID || '').trim();

    if (!apiKey) return res.status(500).json({ ok: false, step: 'env', error: 'LINEAR_API_KEY missing' });
    if (!teamId) return res.status(500).json({ ok: false, step: 'env', error: 'LINEAR_TEAM_ID missing' });

    // 1) Who am I
    const q1 = `query { viewer { id name } }`;
    const r1 = await axios.post('https://api.linear.app/graphql', { query: q1 }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': apiKey }
    });

    // 2) Team by id (validate access)
    const q2 = `query($id:String!){ team(id:$id){ id key name } }`;
    const r2 = await axios.post('https://api.linear.app/graphql', { query: q2, variables: { id: teamId } }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': apiKey }
    });

    return res.status(200).json({
      ok: true,
      env: { apiKey: true, teamId: true },
      viewer: r1.data?.data?.viewer || null,
      team: r2.data?.data?.team || null,
      errors: { viewer: r1.data?.errors || null, team: r2.data?.errors || null }
    });
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data || e?.message;
    return res.status(500).json({ ok: false, step: 'request', status, data });
  }
};


