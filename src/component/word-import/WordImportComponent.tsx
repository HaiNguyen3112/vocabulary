import React, { useEffect, useRef, useState } from "react";
import type { FormProps } from "antd";
import {
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Select,
  Table,
} from "antd";
import { useForm } from "antd/es/form/Form";
import styles from "./WordImportComponent.module.scss";
import { CATEGORYTYPE, CategoryTypeList } from "../../constant/constant";
import { addWord, addWordList } from "../firebase-store/store";
import { FileExcelOutlined } from "@ant-design/icons";
import useFileInput from "../../custom-hook/file-input/UseFileInput";
import { columns, WordType } from "../../dummy-data/words";
type FieldType = {
  word: string;
  definition: string;
  category: CATEGORYTYPE;
};

const WordImportComponent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);

  const [form] = useForm<FieldType>();
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    if (form.getFieldsValue()) {
      const { category, definition, word } = form.getFieldsValue();
      try {
        await addWord({ category, definition, word });
        message.open({ type: "success", content: "Add new word successfull" });
        form.resetFields();
      } catch (error) {
        message.open({
          type: "error",
          content: "Something wrong, please try again",
        });
      }
    }
  };

  const handleOkPreview = async () => {
    if (currentList.length) {
      try {
        await addWordList(currentList);
        message.open({ type: "success", content: "Add list word successfull" });
        setCurrentList([]);
        setIsModalPreviewOpen(false);
      } catch (error) {
        message.open({
          type: "error",
          content: "Something wrong, please try again",
        });
      }
    } else {
      setIsModalPreviewOpen(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const handlePreviewCancel = () => {
    setIsModalPreviewOpen(false);
    setCurrentList([]);
  };

  const { data, handleFileUpload } = useFileInput<WordType>();
  const inputRef = useRef<any>(null);
  const [currentList, setCurrentList] = useState<WordType[]>([]);
  const handleOpenFile = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  useEffect(() => {
    if (data?.length) {
      setCurrentList(data);
      setIsModalPreviewOpen(true);
    }
  }, [data]);

  const modalContent = () => {
    return (
      <div className={styles.form_container}>
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          autoComplete="off"
          form={form}
        >
          <Form.Item<FieldType>
            label="Word"
            name="word"
            rules={[{ required: true, message: "Please input your word!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            label="Definition"
            name="definition"
            rules={[
              { required: true, message: "Please input your definition!" },
            ]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item<FieldType>
            label="Category"
            name="category"
            rules={[{ required: true, message: "Please select category!" }]}
          >
            <Select>
              {CategoryTypeList.map((category) => {
                return (
                  <Select.Option value={category.value} key={category.value}>
                    {category.label}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        </Form>
      </div>
    );
  };
  return (
    <div className={styles.word_container}>
      <div className={styles.right_side}>
        <Button type="primary" onClick={showModal}>
          + Add word
        </Button>
        <Button onClick={handleOpenFile} type="primary">
          <FileExcelOutlined /> Upload file
        </Button>
      </div>

      <input
        style={{ visibility: "hidden", display: "contents" }}
        ref={inputRef}
        type="file"
        onChange={handleFileUpload}
      />
      <Modal
        title="Add More Word"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        zIndex={1000}
      >
        {modalContent()}
      </Modal>
      <Modal
        title="Preview Word List"
        open={isModalPreviewOpen}
        onOk={handleOkPreview}
        onCancel={handlePreviewCancel}
        zIndex={1001}
      >
        <Table
          style={{ height: 500, overflowY: "scroll" }}
          columns={columns}
          dataSource={currentList}
        />
      </Modal>
    </div>
  );
};

export default WordImportComponent;
