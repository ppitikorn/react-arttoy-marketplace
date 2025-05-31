import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [parentCategory, setParentCategory] = useState(null);
  //const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/category/parent');
      setCategories(response.data);
      setIsLoading(false);
    } catch (error) {
      setError('Failed to fetch categories');
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/category', 
        { 
          name: newCategory,
          parent: parentCategory
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      setNewCategory('');
      setParentCategory(null);
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (id, newName) => {
    try {
      await axios.put(`http://localhost:5000/api/category/${id}`,
        { name: newName },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      //setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update category');
    }
  };
  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`http://localhost:5000/api/category/${id}`,
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        fetchCategories();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  // Function to build the category tree
  const buildCategoryTree = (categories) => {
    const map = {};
    const roots = [];

    categories.forEach(cat => {
      map[cat._id] = { ...cat, children: [] };
    });

    categories.forEach(cat => {
      if (cat.parent && cat.parent._id) {
        map[cat.parent._id]?.children.push(map[cat._id]);
      } else {
        roots.push(map[cat._id]);
      }
    });

    return roots;
  };

  // Recursive component to render the category tree with edit/delete functionality
  const CategoryTreeNode = ({ node, depth = 0 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(node.name);

    const handleSave = () => {
      handleUpdateCategory(node._id, editedName);
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
                  onClick={() => handleDeleteCategory(node._id)}
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
              <CategoryTreeNode key={child._id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Category Management</h1>
      
      {/* Create Category Form */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Create New Category</h2>
        <form onSubmit={handleCreateCategory} className="flex gap-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name"
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <label className="text-white" htmlFor='parentCategory'>Parent Category:</label>
          <select 
            id='parentCategory'
            value={parentCategory} 
            onChange={(e) => {
              const selected = e.target.value;
              setParentCategory(selected === "null" ? null : selected);
            }}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="null">Root</option>
            {categories.filter((category) => category.parent === null)
            .map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
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

      {/* Category Tree */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Category Tree</h2>
        {isLoading ? (
          <div className="text-white">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-gray-400">No categories found</div>
        ) : (
          <div className="space-y-2">
            {categoryTree.map(category => (
              <CategoryTreeNode key={category._id} node={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCategories;