(function () {
  const elHigh = document.getElementById('snap-high');
  const elLaw = document.getElementById('snap-lawyers');
  const elSup = document.getElementById('snap-supported');
  const elSec = document.getElementById('snap-security');

  async function fetchSnapshot() {
    try {
      const res = await fetch('/api/admin/system-snapshot', {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch snapshot');

      const data = await res.json();

      // Update UI
      elHigh.textContent = data.highPriority ?? '0';
      elLaw.textContent = data.lawyersAvailable ?? '0';
      elSup.textContent = data.survivorsSupported ?? '0';
      elSec.textContent = data.security ?? 'OK';

    } catch (err) {
      console.warn('snapshot load error:', err);
      elHigh.textContent = '—';
      elLaw.textContent = '—';
      elSup.textContent = '—';
      elSec.textContent = '—';
    }
  }

  fetchSnapshot();
  setInterval(fetchSnapshot, 30000);
})();
