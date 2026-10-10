import { App as AntApp, ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";
import { AppLayout } from "@/app/app-layout";
import { AppRoutes } from "@/app/app-routes";
import { appTheme } from "@/styles/theme";

export default function App() {
  return (
    <ConfigProvider theme={appTheme}>
      <AntApp>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
