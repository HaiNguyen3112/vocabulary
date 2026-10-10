import { Button, Form, Input, Modal, Tabs } from "antd";
import { useState, type ReactNode } from "react";
import { ApiError, getErrorMessage } from "@/api/client";
import { findLearnerRequest, registerLearnerRequest } from "@/api/learners-api";
import { useLearner } from "@/hooks/use-learner";
import { parseLearnerInput, type Learner } from "@shared/learner";
import styles from "./learner-gate.module.scss";

type TabKey = "sign-in" | "register";
type FormValues = { userId?: string; name?: string };

const NOT_FOUND_MESSAGE = "User ID not found — register?";
const USER_ID_HINT = "3–30 characters: a-z, 0-9, _ . -";

/** The name is irrelevant for sign-in; a placeholder lets us reuse the shared user ID rules. */
function validateUserId(userId: string | undefined): string | null {
  const parsed = parseLearnerInput({ userId, name: "x" });
  return parsed.ok ? null : parsed.error;
}

export function LearnerGate({ children }: { children: ReactNode }) {
  const { learner, signIn } = useLearner();
  const [tab, setTab] = useState<TabKey>("sign-in");
  const [signInForm] = Form.useForm<FormValues>();
  const [registerForm] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  if (learner) return <>{children}</>;

  const switchToRegister = () => {
    registerForm.setFieldValue("userId", signInForm.getFieldValue("userId"));
    setTab("register");
  };

  const submit = async (
    form: typeof signInForm,
    run: (values: FormValues) => Promise<{ learner: Learner }>,
    statusErrors: Record<number, string>,
  ) => {
    if (submitting) return;
    setSubmitting(true);
    setNotFound(false);
    try {
      const values = form.getFieldsValue();
      const userIdError = validateUserId(values.userId);
      if (userIdError) {
        form.setFields([{ name: "userId", errors: [userIdError] }]);
        return;
      }
      signIn((await run(values)).learner);
    } catch (error) {
      const known =
        error instanceof ApiError ? statusErrors[error.status] : undefined;
      if (known === NOT_FOUND_MESSAGE) {
        setNotFound(true);
        return;
      }
      form.setFields([
        { name: "userId", errors: [known ?? getErrorMessage(error)] },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  // Rendered as `help` rather than a field error because antd field errors are plain strings.
  const notFoundHelp = (
    <>
      User ID not found —{" "}
      <Button
        type="link"
        size="small"
        className={styles.link}
        onClick={switchToRegister}
      >
        register?
      </Button>
    </>
  );

  const handleSignIn = () =>
    submit(signInForm, (values) => findLearnerRequest(values.userId ?? ""), {
      404: NOT_FOUND_MESSAGE,
    });

  const handleRegister = () => {
    if (submitting) return;
    const parsed = parseLearnerInput(registerForm.getFieldsValue());
    if (!parsed.ok) {
      const field = parsed.error.startsWith("User ID") ? "userId" : "name";
      registerForm.setFields([{ name: field, errors: [parsed.error] }]);
      return;
    }
    void submit(registerForm, () => registerLearnerRequest(parsed.value), {
      409: "User ID already exists",
    });
  };

  return (
    <Modal
      open
      title="Welcome to Study Vocabulary"
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
    >
      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as TabKey)}
        items={[
          {
            key: "sign-in",
            label: "Sign in",
            children: (
              <Form
                form={signInForm}
                name="sign-in"
                layout="vertical"
                onFinish={() => void handleSignIn()}
              >
                <Form.Item
                  name="userId"
                  label="User ID"
                  help={notFound ? notFoundHelp : undefined}
                  validateStatus={notFound ? "error" : undefined}
                >
                  <Input
                    autoFocus
                    autoComplete="username"
                    placeholder="your-user-id"
                    onChange={() => setNotFound(false)}
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  block
                >
                  Sign in
                </Button>
              </Form>
            ),
          },
          {
            key: "register",
            forceRender: true,
            label: "Register",
            children: (
              <Form
                form={registerForm}
                name="register"
                layout="vertical"
                onFinish={handleRegister}
              >
                <Form.Item name="name" label="Name">
                  <Input
                    autoFocus
                    autoComplete="name"
                    maxLength={50}
                    placeholder="Your name"
                  />
                </Form.Item>
                <Form.Item name="userId" label="User ID" extra={USER_ID_HINT}>
                  <Input autoComplete="username" placeholder="your-user-id" />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  block
                >
                  Register
                </Button>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  );
}
