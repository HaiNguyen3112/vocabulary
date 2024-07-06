import style from "./App.module.scss";
import VocabularyStudying from "./component/vocabularyStudying/VocabularyStudying";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ShoppingComponent from "./component/shopping/ShoppingComponent";
function App() {
  return (
    <Router>
      <div className={style.app}>
        <Routes>
          <Route path="/" element={<VocabularyStudying />} />
          <Route path="/vocabulary" element={<VocabularyStudying />} />
          <Route path="/shopping" element={<ShoppingComponent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
