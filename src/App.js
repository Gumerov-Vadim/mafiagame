import { BrowserRouter, Route, Routes } from "react-router-dom";
import Room from './pages/Room';
import Main from './pages/Main';
import NotFound404 from './pages/NotFound404';
import Guide from "./pages/Guide";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path='/login' element={<Login/>} />
        <Route exact path='/signup' element={<Signup/>} />
        <Route exact path='/guide' element={<Guide/>} />
        <Route exact path='/room/:id' element={<Room/>} />
        <Route exact path='/' element={<Main/>} />
        <Route path='*' element={<NotFound404/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
