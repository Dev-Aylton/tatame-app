(() => {
  const notice = document.querySelector("#offline-notice");
  if (!notice) return;

  const updateOfflineNotice = () => {
    notice.hidden = navigator.onLine !== false;
  };

  updateOfflineNotice();
  window.addEventListener("online", updateOfflineNotice);
  window.addEventListener("offline", updateOfflineNotice);
})();
