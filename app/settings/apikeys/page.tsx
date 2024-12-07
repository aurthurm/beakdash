'use client';
import { useState } from 'react';
import { Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);

  const createApiKey = async (data) => {
    const response = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      const newKey = await response.json();
      setKeys([...keys, newKey]);
      setShowCreateModal(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} />
          Create API Key
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Key</th>
              <th className="text-left p-4">Created</th>
              <th className="text-left p-4">Expires</th>
              <th className="text-left p-4">Last Used</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-b">
                <td className="p-4">{key.name}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {showKey === key.id ? key.key : '••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowKey(
                        showKey === key.id ? null : key.id
                      )}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showKey === key.id ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(key.key)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  {new Date(key.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {key.expiresAt 
                    ? new Date(key.expiresAt).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="p-4">
                  {key.lastUsed
                    ? new Date(key.lastUsed).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => deleteKey(key.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <CreateApiKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createApiKey}
        />
      )}
    </div>
  );
}
