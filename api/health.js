module.exports = (req, res) => {
  try {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('health error', e);
    res.status(500).json({ status: 'ERROR', message: e?.message || 'Unknown' });
  }
};


