import { Layout, Menu } from "antd";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { NAV_ITEMS, findNavKey } from "@/app/nav-items";
import { LG_BREAKPOINT_PX } from "@/constants/layout";
import styles from "./app-layout.module.scss";

const { Sider, Content } = Layout;

const MENU_ITEMS = NAV_ITEMS.map((item) => ({
  key: item.path,
  icon: item.icon,
  label: <Link to={item.path}>{item.label}</Link>,
}));

type Props = {
  children: ReactNode;
};

export function AppLayout({ children }: Props) {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // On mobile the sider overlays the content — close it after navigating.
  const handleMenuClick = () => {
    if (window.innerWidth < LG_BREAKPOINT_PX) setIsCollapsed(true);
  };

  return (
    <Layout className={styles.app}>
      <Sider
        className={styles.sider}
        theme="light"
        breakpoint="lg"
        collapsedWidth={0}
        collapsed={isCollapsed}
        onCollapse={setIsCollapsed}
      >
        <Menu
          className={styles.menu}
          mode="inline"
          selectedKeys={[findNavKey(pathname)]}
          items={MENU_ITEMS}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout className={styles.siteLayout}>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}
