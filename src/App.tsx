import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  HomeOutlined,
  ShoppingOutlined,
  UploadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import VocabularyStudying from "./component/vocabularyStudying/VocabularyStudying";
import ShoppingComponent from "./component/shopping/ShoppingComponent";
import ImageUpload from "./component/upload-image/UploadImage";
import WordList from "./component/word-list/WordList";
import style from "./App.module.scss";

const { Sider, Content } = Layout;

const App: React.FC = () => {
  return (
    <Router>
      <Layout className={style.app}>
        <Sider className={style.sidebar} breakpoint="lg" collapsedWidth="0">
          <Menu mode="inline">
            <Menu.Item key="1" icon={<HomeOutlined />}>
              <Link to="/">Vocabulary Studying</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<ShoppingOutlined />}>
              <Link to="/shopping">Shopping</Link>
            </Menu.Item>
            <Menu.Item key="4" icon={<UploadOutlined />}>
              <Link to="/upload">Upload Image</Link>
            </Menu.Item>
            <Menu.Item key="5" icon={<PlusOutlined />}>
              <Link to="/vocabulary-management">Vocabulary Management</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout className={style.siteLayout}>
          <Content className={style.mainContent}>
            <Routes>
              <Route path="/" element={<VocabularyStudying />} />
              <Route path="/vocabulary" element={<VocabularyStudying />} />
              <Route path="/shopping" element={<ShoppingComponent />} />
              <Route path="/upload" element={<ImageUpload />} />
              <Route path="/vocabulary-management" element={<WordList />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;
