const form = document.querySelector('#contact-form');
const status = document.querySelector('.form-status');

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
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
  status.textContent = '이메일 작성 창을 여는 중입니다.';
  window.location.href = `mailto:yoon@esay.co.kr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
});
