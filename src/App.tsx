import style from "./App.module.scss";
import VocabularyStudying from "./component/vocabularyStudying/VocabularyStudying";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ShoppingComponent from "./component/shopping/ShoppingComponent";
import ImageUpload from "./component/upload-image/UploadImage";
function App() {
  return (
    <Router>
      <div className={style.app}>
        <Routes>
          <Route path="/" element={<VocabularyStudying />} />
          <Route path="/vocabulary" element={<VocabularyStudying />} />
          <Route path="/shopping" element={<ShoppingComponent />} />
          <Route path="/upload" element={<ImageUpload />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
