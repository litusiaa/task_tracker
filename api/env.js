module.exports = (_req, res) => {
  const has = (name) => Boolean((process.env[name] || '').trim());
  res.status(200).json({
    runtime: 'node',
    linear: {
      apiKey: has('LINEAR_API_KEY'),
      teamId: has('LINEAR_TEAM_ID'),
      teamKey: has('LINEAR_TEAM_KEY'),
      projectId: has('LINEAR_PROJECT_ID'),
      projectName: has('LINEAR_PROJECT_NAME'),
      workflowStateId: has('LINEAR_WORKFLOW_STATE_ID'),
      workflowStateName: has('LINEAR_WORKFLOW_STATE_NAME'),
      assigneeId: has('LINEAR_ASSIGNEE_ID'),
      users: {
        LERA: has('LINEAR_USER_LERA_ID'),
        KATYA: has('LINEAR_USER_KATYA_ID'),
        ZHENYA: has('LINEAR_USER_ZHENYA_ID'),
        EGOR: has('LINEAR_USER_EGOR_ID'),
        KOSTYA: has('LINEAR_USER_KOSTYA_ID'),
        KIRILL: has('LINEAR_USER_KIRILL_ID'),
        VIOLETTA: has('LINEAR_USER_VIOLETTA_ID'),
        MAKSIM: has('LINEAR_USER_MAKSIM_ID'),
      },
    },
  });
};


