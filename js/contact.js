const form = document.querySelector('#contact-form');
const status = document.querySelector('.form-status');
const submitButton = form?.querySelector('button[type="submit"]');
const submitNote = form?.querySelector('.form-submit p');
const turnstileRoot = form?.querySelector('[data-turnstile]');
let directEnabled = false;
let turnstileWidget;

const loadTurnstile = () => new Promise((resolve, reject) => {
  if (window.turnstile) return resolve(window.turnstile);
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  script.onload = () => resolve(window.turnstile);
  script.onerror = reject;
  document.head.append(script);
});

async function prepareDirectSend() {
  try {
    const response = await fetch('/api/contact', { headers: { Accept: 'application/json' } });
    const config = await response.json();
    if (!response.ok || !config.enabled || !config.siteKey) return;
    const turnstile = await loadTurnstile();
    turnstileWidget = turnstile.render(turnstileRoot, {
      sitekey: config.siteKey,
      theme: 'light',
      size: 'flexible',
    });
    directEnabled = true;
  } catch {
    directEnabled = false;
  }

  if (!directEnabled && submitNote) {
    submitNote.textContent = '직접 전송 설정 전에는 이메일 작성 창이 열립니다.';
  }
}

prepareDirectSend();

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);

  if (directEnabled) {
    const token = window.turnstile?.getResponse(turnstileWidget);
    if (!token) {
      status.textContent = '스팸 방지 확인을 완료해주세요.';
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    status.textContent = '문의를 보내고 있습니다.';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          organization: data.get('organization'),
          phone: data.get('phone'),
          inquiryType: data.get('inquiryType'),
          preferredDate: data.get('preferredDate'),
          message: data.get('message'),
          website: data.get('website'),
          consent: data.get('consent') === 'on',
          turnstileToken: token,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '문의 전송에 실패했습니다.');
      form.reset();
      window.turnstile?.reset(turnstileWidget);
      status.textContent = result.message || '문의가 정상적으로 접수되었습니다.';
    } catch (error) {
      status.textContent = error.message;
      window.turnstile?.reset(turnstileWidget);
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
    }
    return;
  }

  const lines = [
    `이름: ${data.get('name')}`,
    `이메일: ${data.get('email')}`,
    `소속 기관: ${data.get('organization') || '-'}`,
    `연락처: ${data.get('phone') || '-'}`,
    `문의 유형: ${data.get('inquiryType')}`,
    `희망 일정: ${data.get('preferredDate') || '-'}`,
    '',
    '문의 내용',
    String(data.get('message') || ''),
  ];
  const subject = `[ESAY 문의] ${data.get('inquiryType')} · ${data.get('name')}`;
  status.textContent = '직접 전송 설정 전이라 메일 앱을 엽니다.';
  window.location.href = `mailto:yoon@esay.co.kr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
});
