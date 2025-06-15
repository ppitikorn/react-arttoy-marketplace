import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../utils/api.js'; // Assuming you have a custom axios instance

function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [parentBrand, setParentBrand] = useState(null);
  //const [editingBrand, setEditingBrand] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/brands/parent');
      setBrands(response.data);
      setIsLoading(false);
    } catch (error) {
      setError('Failed to fetch brands');
      setIsLoading(false);
    }
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/brands', 
        { 
          name: newBrand,
          parent: parentBrand
        });
      setNewBrand('');
      setParentBrand(selected => selected === "null" ? null : selected); 
      fetchBrands();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create brand');
    }
  };

  const handleUpdateBrand = async (id, newName) => {
    try {
      await api.put(`/api/admin/brands/${id}`,
        { name: newName }
      );
      //setEditingBrand(null);
      fetchBrands();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update brand');
    }
  };
  const handleDeleteBrand = async (id) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        await api.delete(`/api/admin/brands/${id}`);
        fetchBrands();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete brand');
      }
    }
  };

  // Function to build the brand tree
  const buildBrandTree = (brands) => {
    const map = {};
    const roots = [];

    brands.forEach(brand => {
      map[brand._id] = { ...brand, children: [] };
    });

    brands.forEach(brand => {
      if (brand.parent && brand.parent._id) {
        map[brand.parent._id]?.children.push(map[brand._id]);
      } else {
        roots.push(map[brand._id]);
      }
    });

    return roots;
  };

  // Recursive component to render the brand tree with edit/delete functionality
  const BrandTreeNode = ({ node, depth = 0 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(node.name);

    const handleSave = () => {
      handleUpdateBrand(node._id, editedName);
      setIsEditing(false);
    };

    return (
      <div key={node._id} className="w-full">
        <div 
          className="flex items-center gap-4 py-2 px-4  hover:bg-gray-700 rounded-lg transition-colors"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center gap-4">
                <span className="text-white">{node.name}</span>
                <span className="text-sm text-gray-400">({node.slug})</span>
                <span className="text-sm text-gray-400">({node.parent ? node.parent.name : 'Root'})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteBrand(node._id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
        {node.children && node.children.length > 0 && (
          <div className="ml-4">
            {node.children.map(child => (
              <BrandTreeNode key={child._id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const brandTree = buildBrandTree(brands);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Brand Management</h1>

      {/* Create Brand Form */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Create New Brand</h2>
        <form onSubmit={handleCreateBrand} className="flex gap-4">
          <input
            type="text"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            placeholder="Brand name"
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <label className="text-white" htmlFor='parentBrand'>Parent Brand:</label>
          <select 
            id='parentBrand'
            value={parentBrand} 
            onChange={(e) => {
              const selected = e.target.value;
              setParentBrand(selected === "null" ? null : selected);
            }}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="null">Root</option>
            {brands.filter((brand) => brand.parent === null)
            .map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Brand Tree */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Brand Tree</h2>
        {isLoading ? (
          <div className="text-white">Loading brands...</div>
        ) : brands.length === 0 ? (
          <div className="text-gray-400">No brands found</div>
        ) : (
          <div className="space-y-2">
            {brandTree.map(brand => (
              <BrandTreeNode key={brand._id} node={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBrands;