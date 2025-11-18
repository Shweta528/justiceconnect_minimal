// frontend/public/js/profile.js
(function () {
  const form = document.getElementById('profileForm');
  if (!form) return;

  const savedAlert = document.getElementById('profileSaved');
  const errorAlert = document.getElementById('profileError');

  const backBtn = form.querySelector('a.btn.btn-light');

  function showSaved(msg) {
    if (errorAlert) errorAlert.classList.add('d-none');
    if (savedAlert) {
      savedAlert.textContent = msg || 'Profile saved.';
      savedAlert.classList.remove('d-none');
      savedAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function showError(msg) {
    if (savedAlert) savedAlert.classList.add('d-none');
    if (errorAlert) {
      errorAlert.textContent = msg || 'Couldn’t save profile. Please try again.';
      errorAlert.classList.remove('d-none');
      errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async function loadProfile() {
    try {
      const res = await fetch('/api/profile/me', { credentials: 'include' });
      if (!res.ok) {
        console.warn('Profile load failed', res.status);
        return;
      }
      const data = await res.json();

      // Fill form fields
      if (data.preferredName) form.preferredName.value = data.preferredName;
      if (data.legalName) form.legalName.value = data.legalName;
      if (data.contactMethod) form.contactMethod.value = data.contactMethod;
      if (data.email && form.email) form.email.value = data.email;
      if (data.phone) form.phone.value = data.phone;
      if (typeof data.safeToContact === 'boolean') {
        form.safeToContact.checked = data.safeToContact;
      }
      if (data.province) form.province.value = data.province;
      if (data.city) form.city.value = data.city;
      if (data.language) form.language.value = data.language;
      if (data.contactTimes) form.contactTimes.value = data.contactTimes;
      if (data.accessNeeds) form.accessNeeds.value = data.accessNeeds;
      if (data.notes) form.notes.value = data.notes;

      // Optional: avatar
      if (data.avatarUrl) {
        const avatarImg = document.getElementById('avatarPreview');
        if (avatarImg) avatarImg.src = data.avatarUrl;
      }

      // Optional: change "Back to Dashboard" depending on role
      if (backBtn && data.role) {
        if (data.role === 'survivor') backBtn.href = './survivor.html';
        if (data.role === 'lawyer') backBtn.href = './lawyer.html';
        if (data.role === 'admin') backBtn.href = './admin.html';
      }
    } catch (err) {
      console.error('Error loading profile', err);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const payload = {
      preferredName: form.preferredName.value.trim(),
      legalName: form.legalName.value.trim(),
      contactMethod: form.contactMethod.value,
      phone: form.phone.value.trim(),
      safeToContact: form.safeToContact.checked,
      province: form.province.value,
      city: form.city.value.trim(),
      language: form.language.value,
      contactTimes: form.contactTimes.value,
      accessNeeds: form.accessNeeds.value.trim(),
      notes: form.notes.value.trim()
    };

    // Email usually comes from auth; only send if you want to allow editing
    if (form.email && form.email.value.trim()) {
      payload.email = form.email.value.trim();
    }

    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(data.message || 'Couldn’t save profile.');
        return;
      }

      showSaved(data.message || 'Profile updated.');
    } catch (err) {
      console.error('Error saving profile', err);
      showError('Network error. Please try again.');
    }
  }

  // Simple avatar preview (client-side only)
  const avatarInput = document.getElementById('avatar');
  const avatarPreview = document.getElementById('avatarPreview');
  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      avatarPreview.src = url;
    });
  }

  form.addEventListener('submit', saveProfile);

  // Kick off initial load
  loadProfile();
})();
