(function () {
  const $msg = $('#msg');
  const $btn = $('#btnRegister');

  // ============================
  // Helpers
  // ============================
  function setError(inputId, errorId, message) {
    const $input = $('#' + inputId);
    const $error = $('#' + errorId);
    if (message) {
      $input.addClass('is-invalid');
      $error.text(message);
    } else {
      $input.removeClass('is-invalid');
      $error.text('');
    }
  }

  function clearAllErrors() {
    $('.is-invalid').removeClass('is-invalid');
    $('#fnameError,#lnameError,#emailError,#phoneError,#roleError,#expertiseError,#licenseNumberError,#newPasswordError,#confirmPasswordError')
      .text('');
    $msg.addClass('d-none').text('');
  }

  function emailOk(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function passwordStrong(v) {
    // ≥8 chars, at least 1 number & 1 symbol
    return /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(v);
  }

  // NEW: Phone number validation (10–15 digits with optional symbols)
  function phoneOk(v) {
    return /^\+?[0-9()\s\-]{7,15}$/.test(v);
  }

  function showBanner(text, ok = false) {
    $msg.removeClass('d-none alert-danger alert-success')
        .addClass(ok ? 'alert-success' : 'alert-danger')
        .text(text);
  }

  // ============================
  // Lawyer role toggle
  // ============================
  $('#role').on('change', function () {
    if ($(this).val() === 'lawyer') $('#lawyerFields').removeClass('d-none');
    else $('#lawyerFields').addClass('d-none');
  }).trigger('change');

  // ============================
  // Optional email pre-check
  // ============================
  let emailTimer;
  $('#email').on('input', function () {
    clearTimeout(emailTimer);
    const v = this.value.trim();
    if (!emailOk(v)) {
      setError('email', 'emailError', 'Enter a valid email.');
      return;
    } else {
      setError('email', 'emailError', '');
    }

    // Optional email exists check (disabled unless backend supports it)
  });

  // ============================
  // Submit handler
  // ============================
  $btn.on('click', async function () {
    clearAllErrors();

    const fname = $('#fname').val().trim();
    const lname = $('#lname').val().trim();
    const email = $('#email').val().trim();
    const phone = $('#phone').val().trim();
    const role  = $('#role').val();
    const newPassword = $('#newPassword').val();
    const confirmPassword = $('#confirmPassword').val();

    let hasError = false;

    // Validate first name
    if (!fname) {
      setError('fname', 'fnameError', 'First name is required.');
      hasError = true;
    }

    // Validate last name
    if (!lname) {
      setError('lname', 'lnameError', 'Last name is required.');
      hasError = true;
    }

    // Validate email
    if (!email) {
      setError('email', 'emailError', 'Email is required.');
      hasError = true;
    } else if (!emailOk(email)) {
      setError('email', 'emailError', 'Enter a valid email.');
      hasError = true;
    }

    // ============================
    // NEW — PHONE VALIDATION
    // ============================
    if (!phone) {
      setError('phone', 'phoneError', 'Phone number is required.');
      hasError = true;
    } else if (!phoneOk(phone)) {
      setError('phone', 'phoneError', 'Enter a valid phone number.');
      hasError = true;
    } else {
      setError('phone', 'phoneError', '');
    }

    // Validate role
    if (!role) {
      setError('role', 'roleError', 'Role is required.');
      hasError = true;
    }

    // Validate password
    if (!newPassword) {
      setError('newPassword', 'newPasswordError', 'Password is required.');
      hasError = true;
    } else if (!passwordStrong(newPassword)) {
      setError('newPassword', 'newPasswordError', 'Min 8 chars, include number & symbol.');
      hasError = true;
    }

    // Confirm password
    if (newPassword !== confirmPassword) {
      setError('confirmPassword', 'confirmPasswordError', 'Passwords do not match.');
      hasError = true;
    }

    const payload = { fname, lname, phone, email, password: newPassword, role };

    // Lawyer-only fields
    if (role === 'lawyer') {
      payload.expertise = $('#expertise').val().split(',').map(s => s.trim()).filter(Boolean);
      payload.licenseNumber = $('#licenseNumber').val().trim();

      if (!payload.licenseNumber) {
        setError('licenseNumber', 'licenseNumberError', 'License number is required for lawyers.');
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      $btn.prop('disabled', true);
      const resp = await api('/api/auth/register', 'POST', payload);

      // Survivors → redirect to login after registration
      if (role === 'survivor' || role === 'donor') {
        const msg = encodeURIComponent('Registration successful. Please sign in.');
        location.href = `index.html?msg=${msg}`;
        return;
      }

      // Admin/Lawyer → stay on same page
      showBanner(resp.message || 'Registered successfully. Verification pending.', true);

    } catch (e) {
      if (e.status === 409 || (e.details && /already used/i.test(e.details.message || ''))) {
        setError('email', 'emailError', 'Email already used.');
      } else if (e.status === 400) {
        showBanner(e.message || 'Please correct the highlighted fields.');
      } else {
        showBanner(e.message || 'Registration failed.');
      }
    } finally {
      $btn.prop('disabled', false);
    }
  });
})();
