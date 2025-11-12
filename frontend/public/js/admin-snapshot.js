(function () {
  const elHigh = document.getElementById('snap-high');
  const elLaw = document.getElementById('snap-lawyers');
  const elSup = document.getElementById('snap-supported');
  const elSec = document.getElementById('snap-security');

  async function fetchSnapshot() {
    try {
      const res = await fetch('/api/admin/metrics/snapshot', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch snapshot');
      const data = await res.json();

      if (elHigh) elHigh.textContent = (data.highPriorityCases ?? '0').toString();
      if (elLaw)  elLaw.textContent  = (data.lawyersAvailable ?? '0').toString();
      if (elSup)  elSup.textContent  = (data.survivorsSupported ?? '0').toString();
      if (elSec)  elSec.textContent  = data.security || 'OK';
    } catch (e) {
      console.warn('snapshot load error:', e);
      if (elHigh) elHigh.textContent = '—';
      if (elLaw)  elLaw.textContent  = '—';
      if (elSup)  elSup.textContent  = '—';
      if (elSec)  elSec.textContent  = '—';
    }
  }

  // initial load + light polling (every 30s)
  fetchSnapshot();
  setInterval(fetchSnapshot, 30000);
})();
