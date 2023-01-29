if (!document.querySelector('amp-ad').checkVisibility()) {
  const ads = document.querySelectorAll('amp-ad');
  for (const ad of ads) {
    const p = document.createElement('p');
    p.classList = ad.classList;
    p.innerHTML =
      'Please consider disabling your adblocker to support Tournier!';
    ad.outerHTML = p.outerHTML;
  }
}
