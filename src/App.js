import { BrowserRouter, Route, Routes } from "react-router-dom";
import Room from './pages/Room';
import Main from './pages/Main';
import NotFound404 from './pages/NotFound404';
import Guide from "./pages/Guide";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path='/guide' element={<Guide/>} />
        <Route exact path='/room/:id' element={<Room/>} />
        <Route exact path='/' element={<Main/>} />
        <Route path='*' element={<NotFound404/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
