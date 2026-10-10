import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import type { ReactNode } from "react";
import styles from "./page-header.module.scss";

type Props = {
  title: ReactNode;
  backLabel: string;
  onBack: () => void;
  extra?: ReactNode;
};

export function PageHeader({ title, backLabel, onBack, extra }: Props) {
  return (
    <header className={styles.header}>
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} className={styles.back}>
        {backLabel}
      </Button>
      <div className={styles.row}>
        <Typography.Title level={3} className={styles.title}>
          {title}
        </Typography.Title>
        {extra && <div className={styles.extra}>{extra}</div>}
      </div>
    </header>
  );
}
