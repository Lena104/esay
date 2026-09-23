const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

const text = (value, max = 2000) => String(value ?? '').trim().slice(0, max);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedTypes = new Set(['강의·연수', '워크숍', '콘텐츠 제작', '프로젝트 협업', '기관 교육', '기타']);

function ready(env) {
  return Boolean(env.RESEND_API_KEY && env.RESEND_FROM && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
}

export function onRequestGet({ env }) {
  return json({
    enabled: ready(env),
    siteKey: ready(env) ? env.TURNSTILE_SITE_KEY : '',
  });
}

export async function onRequestPost({ request, env }) {
  if (!ready(env)) return json({ error: '문의 메일 설정이 아직 완료되지 않았습니다.' }, 503);

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: '허용되지 않은 요청입니다.' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '문의 내용을 확인할 수 없습니다.' }, 400);
  }

  if (text(body.website, 200)) return json({ ok: true });

  const inquiry = {
    name: text(body.name, 50),
    email: text(body.email, 120),
    organization: text(body.organization, 100),
    phone: text(body.phone, 30),
    inquiryType: text(body.inquiryType, 30),
    preferredDate: text(body.preferredDate, 20),
    message: text(body.message, 2000),
    consent: body.consent === true,
  };

  if (!inquiry.name || !emailPattern.test(inquiry.email) || !allowedTypes.has(inquiry.inquiryType) || inquiry.message.length < 10 || !inquiry.consent) {
    return json({ error: '필수 항목을 다시 확인해주세요.' }, 400);
  }

  const token = text(body.turnstileToken, 4096);
  if (!token) return json({ error: '스팸 방지 확인을 완료해주세요.' }, 400);

  const verification = new FormData();
  verification.set('secret', env.TURNSTILE_SECRET_KEY);
  verification.set('response', token);
  const remoteIp = request.headers.get('CF-Connecting-IP');
  if (remoteIp) verification.set('remoteip', remoteIp);

  const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: verification,
  });
  const turnstile = await turnstileResponse.json();
  if (!turnstile.success) return json({ error: '스팸 방지 확인에 실패했습니다. 다시 시도해주세요.' }, 400);

  const message = [
    `이름: ${inquiry.name}`,
    `이메일: ${inquiry.email}`,
    `소속 기관: ${inquiry.organization || '-'}`,
    `연락처: ${inquiry.phone || '-'}`,
    `문의 유형: ${inquiry.inquiryType}`,
    `희망 일정: ${inquiry.preferredDate || '-'}`,
    '',
    '문의 내용',
    inquiry.message,
  ].join('\n');

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [env.CONTACT_TO || 'yoon@esay.co.kr'],
      reply_to: inquiry.email,
      subject: `[ESAY 문의] ${inquiry.inquiryType} · ${inquiry.name}`,
      text: message,
    }),
  });

  if (!emailResponse.ok) {
    console.error('Resend error', emailResponse.status, await emailResponse.text());
    return json({ error: '메일 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, 502);
  }

  return json({ ok: true, message: '문의가 정상적으로 접수되었습니다.' });
}
