import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Navbar from "./components/common/navbar";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Router>
      <Toaster />
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
