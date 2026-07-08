// Modern replacements for window.confirm / window.alert.
// UIHost (rendered once in App) binds itself here; components then call
// confirmDialog() and toast() from anywhere.

let confirmHandler = null;
let toastHandler = null;

export function bindUI(onConfirm, onToast) {
  confirmHandler = onConfirm;
  toastHandler = onToast;
  return () => {
    confirmHandler = null;
    toastHandler = null;
  };
}

// confirmDialog({ title, message, confirmLabel }) -> Promise<boolean>
export function confirmDialog(options) {
  return new Promise((resolve) => {
    if (confirmHandler) confirmHandler({ ...options, resolve });
    else resolve(window.confirm(options.message)); // fallback if host not mounted
  });
}

// toast('Expense deleted', 'success' | 'error' | 'info')
export function toast(message, type = 'success') {
  if (toastHandler) toastHandler({ id: Date.now() + Math.random(), message, type });
}
