import { App, Button, Form, Input, Result, Select, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import type { Category } from "@shared/categories";
import { normalizeWordKey, type Word } from "@shared/word";
import { ApiError, getErrorMessage } from "@/api/client";
import { ROUTES, wordDetailPath } from "@/app/nav-items";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { PageHeader } from "@/features/shared/page-header";
import { useGoBack } from "@/hooks/use-go-back";
import { useWords } from "@/hooks/use-words";
import { useWordsStore } from "@/store/words-store";
import { RelatedWordsField } from "./related-words-field";
import { SensesField } from "./senses-field";
import { toFormValues, toWordInput, type WordFormValues } from "./word-form-values";
import styles from "./word-edit-form.module.scss";

type Props = {
  /** Absent = add a new word. */
  id?: string;
};

/** Add / edit page. Waits for the word list so `initialValues` are final on first render. */
export function WordEditForm({ id }: Props) {
  const navigate = useNavigate();
  const { words, isLoading } = useWords();
  const editing = id ? words.find((word) => word.id === id) : undefined;

  if (isLoading) return <Spin size="large" />;
  if (id && !editing) {
    return (
      <Result
        status="404"
        title="Word not found"
        extra={<Button onClick={() => navigate(ROUTES.words)}>Back to word list</Button>}
      />
    );
  }
  return <WordForm key={id ?? "new"} editing={editing ?? null} words={words} />;
}

function WordForm({ editing, words }: { editing: Word | null; words: readonly Word[] }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const goBack = useGoBack(editing ? wordDetailPath(editing.id) : ROUTES.words);
  const [form] = Form.useForm<WordFormValues>();
  const addWord = useWordsStore((state) => state.addWord);
  const updateWord = useWordsStore((state) => state.updateWord);
  const existingKeys = new Set(
    words.filter((word) => word.id !== editing?.id).map((word) => normalizeWordKey(word.word)),
  );

  const save = async (values: WordFormValues, addAnother: boolean) => {
    const input = toWordInput(values as WordFormValues & { category: Category });
    try {
      const saved = editing ? await updateWord(editing.id, input) : await addWord(input);
      message.success(editing ? `Saved "${saved.word}"` : `Added "${saved.word}"`);
      if (addAnother) {
        form.setFieldsValue({ ...toFormValues(null), category: values.category });
        return;
      }
      if (editing) {
        // Return to where Edit was opened (usually the detail page) — no duplicate history entry.
        goBack();
        return;
      }
      // Replace the form in history so Back from the new word's page skips it.
      navigate(wordDetailPath(saved.id), { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setFields([{ name: "word", errors: [error.message] }]);
        return;
      }
      message.error(getErrorMessage(error));
    }
  };

  const handleSaveAndAddAnother = async () => {
    try {
      await save(await form.validateFields(), true);
    } catch {
      // validation errors are shown on the fields
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader backLabel="Cancel" onBack={goBack} title={editing ? `Edit "${editing.word}"` : "Add word"} />
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={toFormValues(editing)}
        onFinish={(values) => save(values, false)}
        className={styles.form}
      >
        <Form.Item<WordFormValues>
          label="Word"
          name="word"
          rules={[
            { required: true, whitespace: true, message: "Please input your word!" },
            {
              validator: (_, value?: string) =>
                value && existingKeys.has(normalizeWordKey(value))
                  ? Promise.reject(new Error("This word already exists!"))
                  : Promise.resolve(),
            },
          ]}
        >
          <Input autoFocus />
        </Form.Item>
        <Form.Item<WordFormValues>
          label="Category"
          name="category"
          rules={[{ required: true, message: "Please select category!" }]}
        >
          <Select options={CATEGORY_OPTIONS} showSearch optionFilterProp="label" />
        </Form.Item>
        <SensesField />
        <RelatedWordsField words={words} selfId={editing?.id ?? null} />

        <div className={styles.actions}>
          <Button onClick={goBack}>Cancel</Button>
          {!editing && <Button onClick={handleSaveAndAddAnother}>Save & add another</Button>}
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
}
