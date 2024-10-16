import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import AddInstance from "./pages/addInstance";
import Navbar from "./components/common/navbar";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-instance" element={<AddInstance />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
