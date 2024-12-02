import React, { useState } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Globe, 
  Radio, 
  Plus,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';

// Test connection function (implement actual logic based on your backend)
const testConnection = async (dataSource) => {
  try {
    const response = await fetch('/api/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataSource)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

const DataSourceManagement = () => {
  const [dataSources, setDataSources] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [editingSource, setEditingSource] = useState(null);
  const [testingStatus, setTestingStatus] = useState({});

  const dataSourceTypes = [
    {
      type: 'sql',
      name: 'SQL Database',
      icon: Database,
      fields: [
        { name: 'name', label: 'Connection Name', type: 'text' },
        { name: 'host', label: 'Host', type: 'text' },
        { name: 'port', label: 'Port', type: 'number' },
        { name: 'database', label: 'Database Name', type: 'text' },
        { name: 'username', label: 'Username', type: 'text' },
        { name: 'password', label: 'Password', type: 'password' }
      ]
    },
    {
      type: 'csv',
      name: 'CSV Upload',
      icon: FileSpreadsheet,
      fields: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'file', label: 'File', type: 'file' }
      ]
    },
    {
      type: 'rest',
      name: 'REST API',
      icon: Globe,
      fields: [
        { name: 'name', label: 'API Name', type: 'text' },
        { name: 'endpoint', label: 'Endpoint URL', type: 'text' },
        { name: 'method', label: 'Method', type: 'select', options: ['GET', 'POST'] },
        { name: 'headers', label: 'Headers (JSON)', type: 'textarea' },
        { name: 'authentication', label: 'Authentication Type', type: 'select', options: ['None', 'Basic', 'Bearer'] }
      ]
    },
    {
      type: 'websocket',
      name: 'WebSocket',
      icon: Radio,
      fields: [
        { name: 'name', label: 'Connection Name', type: 'text' },
        { name: 'url', label: 'WebSocket URL', type: 'text' },
        { name: 'protocol', label: 'Protocol', type: 'text' }
      ]
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newDataSource = {
      id: editingSource ? editingSource.id : Date.now(),
      type: selectedType,
      ...formData
    };

    if (editingSource) {
      setDataSources(prev => 
        prev.map(ds => ds.id === editingSource.id ? newDataSource : ds)
      );
    } else {
      setDataSources(prev => [...prev, newDataSource]);
    }

    setShowAddModal(false);
    setFormData({});
    setSelectedType(null);
    setEditingSource(null);
  };

  const handleEdit = (dataSource) => {
    setEditingSource(dataSource);
    setSelectedType(dataSource.type);
    setFormData(dataSource);
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    setDataSources(prev => prev.filter(ds => ds.id !== id));
  };

  const handleTest = async (dataSource) => {
    setTestingStatus(prev => ({ ...prev, [dataSource.id]: 'testing' }));
    const success = await testConnection(dataSource);
    setTestingStatus(prev => ({ ...prev, [dataSource.id]: success ? 'success' : 'failed' }));
    setTimeout(() => {
      setTestingStatus(prev => ({ ...prev, [dataSource.id]: null }));
    }, 3000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Data Sources</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} />
          Add Data Source
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataSources.map((source) => {
          const TypeIcon = dataSourceTypes.find(t => t.type === source.type)?.icon;
          return (
            <div key={source.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {TypeIcon && <TypeIcon size={24} className="text-gray-500" />}
                  <div>
                    <h3 className="font-semibold">{source.name}</h3>
                    <p className="text-sm text-gray-500">{source.type.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(source)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Test Connection"
                  >
                    <RefreshCw 
                      size={20} 
                      className={`${
                        testingStatus[source.id] === 'testing' ? 'animate-spin' : ''
                      } ${
                        testingStatus[source.id] === 'success' ? 'text-green-500' : 
                        testingStatus[source.id] === 'failed' ? 'text-red-500' : 
                        'text-gray-500'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(source)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 size={20} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingSource ? 'Edit Data Source' : 'Add New Data Source'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSource(null);
                  setFormData({});
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {!selectedType ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataSourceTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => setSelectedType(type.type)}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <type.icon size={24} className="text-gray-500" />
                    <span>{type.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {dataSourceTypes
                  .find(t => t.type === selectedType)
                  ?.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                          className="w-full border rounded-lg p-2"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                          className="w-full border rounded-lg p-2"
                          rows={3}
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                          className="w-full border rounded-lg p-2"
                        />
                      )}
                    </div>
                  ))}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType(null);
                      setFormData({});
                    }}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {editingSource ? 'Update' : 'Add'} Data Source
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourceManagement;