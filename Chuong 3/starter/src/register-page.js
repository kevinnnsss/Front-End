// Form tạo tài khoản thành viên: kiểm dữ liệu ở trình duyệt, gửi POST /api/auth/register,
// rồi hiện kết quả. Lỗi của trình duyệt và lỗi server (400, 409) hiện cùng một chỗ: dưới từng ô.
import { clearDraft, restoreDraft, saveDraft } from './register-draft.js';
import { el } from './render.js';
import { ApiError, registerMember } from './api.js';
// TODO(ch3-T6): import { ApiError, registerMember } from './api.js';

const form = document.querySelector('#register-form');
const alertBox = document.querySelector('#form-alert');
const submitButton = form.querySelector('button[type="submit"]');

const STUDENT_ID_PATTERN = /^\d{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
/** FormData đọc mọi ô theo thuộc tính name — không cần querySelector từng ô */
function readForm() {
  // TODO(ch3-T6): const data = new FormData(form); trả về object
  // { studentId, name, email (đã trim), password, passwordConfirm, agree: data.has('agree') }
  const data = new FormData(form);
  return {
    studentId: data.get('studentId').trim(),
    name: data.get('name').trim(),
    email: data.get('email').trim(),
    password: data.get('password'),
    passwordConfirm: data.get('passwordConfirm'),
    agree: data.has('agree'), // checkbox chưa tích thì không có trong FormData
  };
}

/**
 * Kiểm dữ liệu trước khi gửi. Trả về lỗi theo đúng dạng `errors` server gửi về
 * ({ email: ['…'] }) để dùng chung hàm showFieldErrors. Object rỗng = hợp lệ.
 */
function validate(values) {
  // TODO(ch3-T6): kiểm từng trường, thêm lỗi tiếng Việt:
  //   studentId đúng 10 chữ số (/^\d{10}$/), name ≥ 2 ký tự, email đúng dạng,
  //   password ≥ 8 ký tự, passwordConfirm === password, agree === true
  const data = new FormData(form);
  return {
    studentId: data.get('studentId').trim(),
    name: data.get('name').trim(),
    email: data.get('email').trim(),
    password: data.get('password'),
    passwordConfirm: data.get('passwordConfirm'),
    agree: data.has('agree'), // checkbox chưa tích thì không có trong FormData
  };
}

// ---- Hiện thông báo ----

function clearMessages() {
  alertBox.replaceChildren();
  for (const box of form.querySelectorAll('[data-error-for]')) box.textContent = '';
  for (const input of form.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
}

function showFieldErrors(errors) {
  // TODO(ch3-T6): với mỗi [tên trường, mảng thông báo] trong errors:
  //   - ghi thông báo vào <small data-error-for="{tên trường}">
  //   - đặt aria-invalid="true" cho ô form.elements[tên trường]
  // rồi focus ô lỗi đầu tiên.
  for (const [fieldName, messages] of Object.entries(errors)) {
    const box = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (box) box.textContent = messages.join(' ');
    // aria-invalid: trình đọc màn hình đọc "không hợp lệ" khi người dùng vào ô này
    form.elements[fieldName]?.setAttribute('aria-invalid', 'true');
  }
  // Đưa con trỏ tới ô lỗi đầu tiên để sửa ngay
  form.querySelector('[aria-invalid="true"]')?.focus();
}

function showAlert(kind, message) {
  const role = kind === 'error' ? 'alert' : 'status';
  alertBox.replaceChildren(el('p', { className: `alert alert--${kind}`, text: message, attrs: { role } }));
}

function setSubmitting(isSubmitting) {
  // Khoá nút khi đang gửi: bấm hai lần sẽ gửi hai request
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Đang gửi…' : 'Tạo tài khoản';
}

// ---- Gửi form ----

async function handleSubmit(event) {
  event.preventDefault(); // không để trình duyệt tự gửi form và tải lại trang
  clearMessages();

  const values = readForm();
  const errors = validate(values);
  if (Object.keys(errors).length > 0) {
    showFieldErrors(errors);
    return;
  }

  // TODO(ch3-T6): gửi form
  // 1. setSubmitting(true)
  // 2. const member = await registerMember(values) → form.reset() + showAlert('success', 'Đã tạo tài khoản cho {name} ({email})…')
  // 3. catch: ApiError 409 → lỗi dưới ô email + showAlert('error', …);
  //           ApiError 400 → showFieldErrors(error.fieldErrors); lỗi khác → showAlert('error', error.message)
  // 4. finally: setSubmitting(false)
  setSubmitting(true);
  try {
    const member = await registerMember(values);
    form.reset();
    showAlert('success', `Đã tạo tài khoản cho ${member.name} (${member.email}). Chào mừng bạn đến với EduHub!`);
  } catch (error) {
    showRegisterError(error);
  } finally {
    setSubmitting(false);
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('reset', () => {
  clearMessages();
  clearDraft();
});

// (Challenge ch3-T7) nháp tự lưu mỗi lần gõ, tự điền lại khi mở trang
form.addEventListener('input', () => saveDraft(form));
restoreDraft(form);
