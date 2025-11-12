// frontend/public/js/survivor.js
(function () {
  // Require logged-in survivor
  //if (typeof guard === 'function') guard(['survivor']);

  // ====== Constants / Elements ======
  const form = document.getElementById('caseRequestForm');
  if (!form) return;

  const successBox = document.getElementById('caseRequestSuccess');
  const errorBox   = document.getElementById('caseRequestError');

  const fileInput  = document.getElementById('attachments');
  const fileList   = document.getElementById('fileList');
  const fileError  = document.getElementById('fileError');

  const urgencyError = document.getElementById('urgencyError');

  const MAX_FILES = 5;
  const MAX_PER_FILE = 10 * 1024 * 1024;  // 10 MB
  const MAX_TOTAL   = 25 * 1024 * 1024;   // 25 MB
  const ALLOWED_EXT = /\.(pdf|jpe?g|png|gif|webp|heic|txt|rtf|docx?)$/i;

  // ====== Helpers ======
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B','KB','MB','GB'], i = Math.floor(Math.log(bytes)/Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function clearAlerts() {
    successBox.classList.add('d-none');
    errorBox.classList.add('d-none');
  }

  function showSuccess(msg) {
    successBox.textContent = msg || 'Request received. We’ll review and follow up shortly.';
    successBox.classList.remove('d-none');
    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showError(msg) {
    errorBox.textContent = msg || 'There was an issue submitting your request. Please try again.';
    errorBox.classList.remove('d-none');
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function validateUrgency() {
    const checked = !!form.querySelector('input[name="urgency"]:checked');
    urgencyError.style.display = checked ? 'none' : 'block';
    return checked;
  }

  function validateFiles(files) {
    fileError.style.display = 'none';
    fileError.textContent = '';
    fileList.innerHTML = '';

    if (!files || !files.length) return true;

    let total = 0;
    const problems = [];

    if (files.length > MAX_FILES) {
      problems.push(`You can upload up to ${MAX_FILES} files.`);
    }

    Array.from(files).forEach(f => {
      total += f.size;

      if (!ALLOWED_EXT.test(f.name)) {
        problems.push(`"${f.name}" has an unsupported type.`);
      }
      if (f.size > MAX_PER_FILE) {
        problems.push(`"${f.name}" is ${formatBytes(f.size)} (limit ${formatBytes(MAX_PER_FILE)}).`);
      }

      const li = document.createElement('li');
      li.textContent = `${f.name} • ${formatBytes(f.size)}`;
      fileList.appendChild(li);
    });

    if (total > MAX_TOTAL) {
      problems.push(`Total size ${formatBytes(total)} exceeds ${formatBytes(MAX_TOTAL)}.`);
    }

    if (problems.length) {
      fileError.textContent = problems.join(' ');
      fileError.style.display = 'block';
      return false;
    }
    return true;
  }

  // ====== Live file validation ======
  if (fileInput) {
    fileInput.addEventListener('change', () => validateFiles(fileInput.files));
  }

  // ====== Submit handler ======
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAlerts();

    // Custom parts
    const urgencyOK = validateUrgency();
    const filesOK   = validateFiles(fileInput ? fileInput.files : null);

    // HTML5 validation
    if (!form.checkValidity() || !urgencyOK || !filesOK) {
      e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    // Build FormData
    const fd = new FormData(form);
    // Normalize booleans
    fd.set('safeToContact', form.safeToContact.checked ? 'true' : 'false');
    fd.set('safetyConcern', form.safetyConcern.checked ? 'true' : 'false');

    try {
      // Submit to backend
      const res = await fetch('/api/cases/request', {
        method: 'POST',
        body: fd,
        credentials: 'include' // send session cookie
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Map backend field errors if present
        if (data && data.errors) {
          Object.entries(data.errors).forEach(([name, message]) => {
            const el = form.querySelector(`[name="${name}"]`);
            if (el) {
              el.classList.add('is-invalid');
              // place message under element if has sibling invalid-feedback
              let fb = el.parentElement.querySelector('.invalid-feedback');
              if (!fb) {
                fb = document.createElement('div');
                fb.className = 'invalid-feedback';
                el.parentElement.appendChild(fb);
              }
              fb.textContent = message;
            }
          });
        }
        showError(data.message || 'Unable to submit right now.');
        return;
      }

      // Success
      showSuccess(data.message || 'Request submitted successfully.');
      form.reset();
      fileList.innerHTML = '';
      fileError.style.display = 'none';
      urgencyError.style.display = 'none';
      form.classList.remove('was-validated');

    } catch (err) {
      console.error(err);
      showError('Network error. Please try again.');
    }
  });

  // Nav cleanup (CSP safe)
  document.querySelectorAll('a[href^="javascript:"]').forEach(a => a.setAttribute('href', '#'));
  $('#btnLogout, #btnLogoutTop').on('click', function (e) {
    e.preventDefault();
    if (typeof logout === 'function') logout();
  });
  // Optional: sidebar toggle if your theme script isn’t active
  const headerCollapse = document.getElementById('headerCollapse');
  const sidebarCollapse = document.getElementById('sidebarCollapse');
  [headerCollapse, sidebarCollapse].forEach(el => {
    if (el) el.addEventListener('click', (evt) => {
      evt.preventDefault();
      document.body.classList.toggle('sidebar-open');
    });
  });

})();
