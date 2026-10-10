import { App, Button } from "antd";
import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_KEY = "pwa-update";

/** Registers the service worker; asks before switching to a new version (never mid-session). */
export function PwaUpdatePrompt() {
  const { message, notification } = App.useApp();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;
    notification.info({
      key: UPDATE_KEY,
      message: "Đã có phiên bản mới",
      duration: 0,
      btn: (
        <Button type="primary" size="small" onClick={() => void updateServiceWorker(true)}>
          Tải lại
        </Button>
      ),
      onClose: () => setNeedRefresh(false),
    });
  }, [needRefresh, notification, setNeedRefresh, updateServiceWorker]);

  useEffect(() => {
    if (!offlineReady) return;
    void message.success("App đã sẵn sàng dùng offline");
    setOfflineReady(false);
  }, [offlineReady, message, setOfflineReady]);

  return null;
}
