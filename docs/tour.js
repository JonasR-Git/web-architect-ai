(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const descriptions = [
    'Introduces the studio and its services, with a clear route to contact.',
    'Explains the people, approach and working process behind the studio.',
    'Provides contact information and a simple enquiry flow.',
  ];
  const pathInput = document.getElementById('about-path');
  const status = document.getElementById('path-status');
  const output = document.getElementById('sample-output');
  const download = document.getElementById('download');
  let valid = true;
  const makeBlueprint = () => ({
    sampleData: true,
    status: 'draft-for-review',
    source: 'Fictional studio website',
    pages: [
      { sourcePath: '/', targetPath: '/', purpose: 'Service overview' },
      { sourcePath: '/about', targetPath: pathInput.value.trim(), purpose: 'Studio story and approach' },
      { sourcePath: '/contact', targetPath: '/contact', purpose: 'Contact details and enquiry' },
    ],
    review: ['Review redirects before shipping', 'Check content and accessibility', 'Validate implementation with tests'],
  });
  const update = () => {
    const path = pathInput.value.trim();
    valid = /^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*$/.test(path) && !['/', '/contact'].includes(path);
    pathInput.setAttribute('aria-invalid', String(!valid));
    status.textContent = valid
      ? (path === '/about' ? 'The draft keeps /about.' : `The draft proposes /about to ${path}. Review the redirect before shipping.`)
      : 'Use a unique path beginning with /. Letters, numbers, hyphens and / are supported.';
    output.textContent = valid ? JSON.stringify(makeBlueprint(), null, 2) : 'Fix the target path in the blueprint before exporting.';
    download.disabled = !valid;
  };
  const selectTab = (selected) => {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') next = tabs[0];
      if (event.key === 'End') next = tabs[tabs.length - 1];
      if (next) { event.preventDefault(); selectTab(next); next.focus(); }
    });
  });
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-page]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      document.getElementById('page-description').textContent = descriptions[Number(button.dataset.page)];
    });
  });
  pathInput.addEventListener('input', update);
  download.addEventListener('click', () => {
    if (!valid) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(makeBlueprint(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'sample-blueprint.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  update();
})();
