import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select } from "antd";
import { MAX_SENSES } from "@shared/word";
import { PART_OF_SPEECH_OPTIONS } from "@/constants/part-of-speech";
import styles from "./senses-field.module.scss";

/** Form.List of meanings — one per part of speech, each with example sentences. */
export function SensesField() {
  return (
    <Form.List
      name="senses"
      rules={[
        {
          validator: (_, senses?: unknown[]) =>
            senses && senses.length > 0 ? Promise.resolve() : Promise.reject(new Error("Add at least one meaning")),
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <div className={styles.list}>
          {fields.map((field, index) => (
            <div key={field.key} className={styles.sense}>
              <div className={styles.senseHeader}>
                <span className={styles.index}>Meaning {index + 1}</span>
                <Form.Item name={[field.name, "partOfSpeech"]} noStyle>
                  <Select placeholder="Word type" allowClear options={PART_OF_SPEECH_OPTIONS} className={styles.posSelect} />
                </Form.Item>
                {fields.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={`Remove meaning ${index + 1}`}
                    onClick={() => remove(field.name)}
                  />
                )}
              </div>
              <Form.Item
                name={[field.name, "definition"]}
                rules={[{ required: true, whitespace: true, message: "Please input the definition!" }]}
              >
                <Input.TextArea rows={2} placeholder="Definition" />
              </Form.Item>
              <Form.Item name={[field.name, "examplesText"]} extra="One example sentence per line" className={styles.examples}>
                <Input.TextArea rows={2} placeholder="Example sentences" />
              </Form.Item>
            </div>
          ))}
          <Form.ErrorList errors={errors} />
          {fields.length < MAX_SENSES && (
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ definition: "" })} block>
              Add meaning (another word type)
            </Button>
          )}
        </div>
      )}
    </Form.List>
  );
}
