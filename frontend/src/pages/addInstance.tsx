import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

function AddInstance() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetch('/instances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, url }),
    })
      .then((response) => response.json())
      .then(() => navigate('/'));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add Caddy Instance</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Name</label>
          <Input
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
  );
}

export default AddInstance;