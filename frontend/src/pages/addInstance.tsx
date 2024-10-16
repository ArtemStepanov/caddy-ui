import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { addCaddyInstance } from "@/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label";

function AddInstance() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addCaddyInstance({
      name,
      url,
    }).then(() => navigate("/"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Caddy Instance</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="id">Name</Label>
              <Input
                id="name"
                type="text"
                className="w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2">URL</label>
              <Input
                type="url"
                className="w-full"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <Button type="submit">Add Instance</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default AddInstance;
