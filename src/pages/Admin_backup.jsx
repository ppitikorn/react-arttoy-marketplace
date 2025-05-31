import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Demotree from './Demotree';

function Admin() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [parentCategory, setParentCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/category/parent');
      setCategories(response.data);
      console.log('Categories fetched:', response.data);  
    } catch (error) {
      setError('Failed to fetch categories');
    }
  };
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating category:', newCategory, 'Parent:', parentCategory);
      await axios.post('http://localhost:5000/api/category', 
        { name: newCategory ,
          parent: parentCategory
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      setNewCategory('');
      setParentCategory('');
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create category');
    }
  };
  const handleUpdateCategory = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/category/${id}`,
        { name: editingCategory.name },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      setEditingCategory(null);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Create Category Form */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Create New Category</h2>
        <form onSubmit={handleCreateCategory} className="flex gap-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <label className="text-white">Parent Category: {parentCategory}</label>
          <select value={parentCategory} onChange={(e) => { const selected = e.target.value; setParentCategory(selected === "null" ? null : selected); }} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="null" className='text-gray-800'>Top Parent</option> 
            {categories.filter((category) => category.parent === null)
            .map((category) => (
              <option key={category._id} value={category._id} className='text-gray-800'>
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
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Category Tree</h2>
        <Demotree />
      </div>
      {/* Categories List */}
      <div className="bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold p-6 border-b">Categories</h2>
        <div className="divide-y">
          {categories.map((category) => (
            <div key={category._id} className="p-6 flex items-center justify-between">
              {editingCategory?.id === category._id ? (
                <div className="flex-1 flex gap-4">
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleUpdateCategory(category._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-lg">{category.name}</span>
                  <span className="text-sm text-gray-400">{category.slug}</span>
                  <span className="text-sm text-gray-400">{category.parent ? category.parent.name : "Top Parent"}</span>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCategory({ id: category._id, name: category.name })}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;
