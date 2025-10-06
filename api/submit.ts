import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export const config = { runtime: 'nodejs20.x' } as const;

function isUuid(v?: string) {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function pickAssignee(requester?: string, approvalType?: string) {
  const env = process.env as Record<string, string | undefined>;
  const val = (k: string) => (env[k] || '').trim();
  const read = (a: string, ...b: string[]) => {
    const v = val(a);
    if (v) return v;
    for (const k of b) { const t = val(k); if (t) return t; }
    return '';
  };
  const users = {
    lera: read('LINEAR_USER_LERA_ID'),
    katya: read('LINEAR_USER_KATYA_ID'),
    zhenya: read('LINEAR_USER_ZHENYA_ID'),
    egor: read('LINEAR_USER_EGOR_ID'),
    kostya: read('LINEAR_USER_KOSTYA_ID'),
    kirill: read('LINEAR_USER_KIRILL_ID', 'LINEAR_USER_KIRA_ID'),
    violetta: read('LINEAR_USER_VIOLETTA_ID', 'LINEAR_USER_VITA_ID'),
    maksim: read('LINEAR_USER_MAKSIM_ID'),
  } as const;

  if (approvalType === 'ДС') return users.lera;
  if (approvalType === 'Запрос на расход' || approvalType === 'Запрос на закупку сервисов в Dbrain') return users.katya;
  if (approvalType === 'Квота для КП') {
    if (requester === 'Костя Поляков') return users.kostya;
    if (requester === 'Кирилл Стасюкевич') return users.kirill;
    if (requester === 'Евгения Попова') return users.zhenya;
    if (requester === 'Максим Короткевич') return users.maksim;
    if (requester === 'Сотрудник Dbrain') return users.violetta;
    return users.lera;
  }
  return users.lera;
}

function buildTitle(data: any) {
  const t = data?.approvalType;
  const company = data?.companyName || '';
  if (t === 'ДС') return ['ДС', company].filter(Boolean).join(' · ');
  if (t === 'Запрос на расход') return ['Запрос на расход', data?.expenseName || ''].filter(Boolean).join(' · ');
  if (t === 'Запрос на закупку сервисов в Dbrain') return ['Закупка сервисов Dbrain', data?.serviceName || ''].filter(Boolean).join(' · ');
  if (t === 'Квота для КП') return ['Квота для КП', company, data?.quotationType || ''].filter(Boolean).join(' · ');
  if (t === 'NDA') return ['NDA', company, data?.priority || ''].filter(Boolean).join(' · ');
  if (t === 'Договор') return ['Договор', company, data?.priority || ''].filter(Boolean).join(' · ');
  return ['Согласование', company].filter(Boolean).join(' · ');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const rawBody: any = (req as any).body;
    const data = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

    const apiKey = (process.env.LINEAR_API_KEY || '').trim();
    const teamId = (process.env.LINEAR_TEAM_ID || '').trim();
    if (!apiKey || !teamId) {
      return res.status(500).json({ success: false, error: 'Linear configuration is missing (apiKey/teamId)' });
    }

    const title = buildTitle(data);
    const description = `Информация:\n• Тип согласования: ${data?.approvalType}\n• Запрашивающий: ${data?.requester}\n• Компания: ${data?.companyName || ''}`;
    const assigneeMaybe = pickAssignee(data?.requester, data?.approvalType);
    const stateId = (process.env.LINEAR_WORKFLOW_STATE_ID || '').trim();
    const projectId = (process.env.LINEAR_PROJECT_ID || '').trim();

    const inputAny: any = { teamId, title, description };
    if (isUuid(assigneeMaybe)) inputAny.assigneeId = assigneeMaybe;
    if (isUuid(stateId)) inputAny.stateId = stateId;
    if (isUuid(projectId)) inputAny.projectId = projectId;

    const mutation = `mutation IssueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id url title description } } }`;
    const resp = await axios.post('https://api.linear.app/graphql', { query: mutation, variables: { input: inputAny } }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': apiKey }
    });
    const issue = (resp.data && resp.data.data && resp.data.data.issueCreate && resp.data.data.issueCreate.issue) || null;
    if (!issue) {
      return res.status(500).json({ success: false, error: `Linear API error: ${JSON.stringify(resp.data?.errors || resp.data)}` });
    }

    return res.status(200).json({ success: true, data: { id: issue.id, url: issue.url, title: issue.title, description: issue.description || '' } });
  } catch (error: any) {
    const status = error?.response?.status;
    const details = error?.response?.data || error?.message;
    try { console.error('submit error', status, details); } catch {}
    const text = typeof details === 'string' ? details : JSON.stringify(details);
    return res.status(500).json({ success: false, error: text || 'A server error has occurred' });
  }
}


