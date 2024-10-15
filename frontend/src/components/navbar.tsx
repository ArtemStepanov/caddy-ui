import { Link } from "react-router-dom";
import { Button } from "./ui/button";

function Navbar() {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800 mr-8">Caddy Web UI</h1>
      <div className="space-x-4">
        <Link to="/">
          <Button
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-100"
          >
            Dashboard
          </Button>
        </Link>
        <Link to="/add-instance">
          <Button className="bg-black text-white hover:bg-gray-800">
            Add Instance
          </Button>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
