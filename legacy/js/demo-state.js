export function enableDemoMode() {}

export function disableDemoMode() {}

export function isDemoMode() {
  return false;
}

export function withDemoQuery(href) {
  return href;
}

export function navigateTo(href, options = {}) {
  if (options.replace) {
    window.location.replace(href);
    return;
  }

  window.location.href = href;
}

export function syncDemoLinks() {}

export function getDemoUser() {
  return null;
}

export function getDemoProfile() {
  return null;
}

export function getDemoCollection() {
  return [];
}

export function saveDemoCollection() {}

export function insertDemoRecord() {
  return "";
}

export function updateDemoRecord() {}

export function removeDemoRecord() {}
