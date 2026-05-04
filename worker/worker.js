const TO_NUMBER = 'whatsapp:+17864295671';
const FROM_NUMBER = 'whatsapp:+14155238886';

const ALLOWED_ORIGINS = [
  'https://truvidamg.com',
  'https://www.truvidamg.com',
  'https://truvidaweb.odd-art-3189.workers.dev',
  'https://truvidaweb.pages.dev',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400, origin);
    }

    if (data.website) {
      return json({ ok: true }, 200, origin);
    }

    const body = formatSms(data);

    const params = new URLSearchParams();
    params.append('To', TO_NUMBER);
    params.append('From', FROM_NUMBER);
    params.append('Body', body);

    const auth = btoa(`${env.twiliosid}:${env.twilioauth}`);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${env.twiliosid}/Messages.json`;

    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Twilio error', res.status, errText);
      return json({ ok: false, error: 'Send failed' }, 502, origin);
    }

    return json({ ok: true }, 200, origin);
  },
};

function json(payload, status, origin) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function formatSms(d) {
  const s = (v) => (v == null ? '' : String(v).trim());

  if (d.urgent) {
    const lines = [
      '🚨 TRUVIDA — URGENT / Same-day request',
      '',
      s(d.name),
      `Phone: ${s(d.phone)}`,
    ];
    if (s(d.notes)) lines.push('', s(d.notes));
    return lines.join('\n');
  }

  const patient = s(d.patientType).toLowerCase() === 'returning' ? 'RETURNING' : 'NEW';
  const lang = s(d.formLang).toLowerCase() === 'es' ? 'ES' : 'EN';

  const visitTypeRaw = s(d.visitType).toLowerCase();
  const visitTypeLabel = visitTypeRaw === 'telehealth' ? 'Telehealth' : visitTypeRaw === 'inperson' ? 'In-person' : '';

  const lines = [
    'TRUVIDA — New booking request',
    '',
    `${s(d.name)} (${patient} PATIENT)`,
    `Phone: ${s(d.phone)}`,
    `Email: ${s(d.email)}`,
  ];
  if (s(d.dob)) lines.push(`DOB: ${s(d.dob)}`);
  lines.push('');
  if (visitTypeLabel) lines.push(`Visit type: ${visitTypeLabel}`);
  if (s(d.service)) lines.push(`Service: ${s(d.service)}`);
  if (s(d.reason)) lines.push(`Reason: ${s(d.reason)}`);
  const when = [s(d.date), s(d.window)].filter(Boolean).join(', ');
  if (when) lines.push(`Preferred: ${when}`);
  if (s(d.doctor)) lines.push(`Provider: ${s(d.doctor)}`);
  lines.push(`Lang: ${lang}`);
  if (s(d.notes)) {
    lines.push('', 'Notes:', s(d.notes));
  }
  return lines.join('\n');
}
