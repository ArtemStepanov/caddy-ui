import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { AddInstanceDialog } from "../instance/dialogs/addInstanceDialog.tsx";

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
        <AddInstanceDialog />
      </div>
    </nav>
  );
}

export default Navbar;
