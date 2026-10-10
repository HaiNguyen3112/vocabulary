import { UserOutlined } from "@ant-design/icons";
import { Button, Dropdown } from "antd";
import { useLearner } from "@/hooks/use-learner";
import { useIsMobile } from "@/hooks/use-media-query";

export function LearnerMenu() {
  const { learner, signOut } = useLearner();
  const isMobile = useIsMobile();
  if (!learner) return null;

  return (
    <Dropdown
      trigger={["click"]}
      menu={{ items: [{ key: "switch", label: "Switch learner", onClick: signOut }] }}
    >
      <Button type="text" icon={<UserOutlined />} aria-label={`Learner: ${learner.name}`}>
        {isMobile ? null : learner.name}
      </Button>
    </Dropdown>
  );
}
