import { App as AntApp, ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";
import { AppLayout } from "@/app/app-layout";
import { AppRoutes } from "@/app/app-routes";
import { useApplyColorScheme, useResolvedColorScheme } from "@/hooks/use-color-scheme";
import { appThemes } from "@/styles/theme";

export default function App() {
  const scheme = useResolvedColorScheme();
  useApplyColorScheme(scheme);

  return (
    <ConfigProvider theme={appThemes[scheme]}>
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
