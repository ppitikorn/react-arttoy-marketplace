//CRUD Tags for products by admin only
import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../utils/api';

function AdminTags() {
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [editingTag, setEditingTag] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        fetchTags();
    }, []);
    
    const fetchTags = async () => {
        try {
        const response = await api.get('/api/admin/tags');
        //console.log(response.data);
        setTags(response.data);
        } catch (error) {
          const errorMsg = 'Failed to fetch tags';
          setError(errorMsg);
          message.error(errorMsg);
        }
    };
    
    const handleCreateOrUpdateTag = async () => {
        try {
        if (editingTag) {
            await api.put(`/api/admin/tags/${editingTag._id}`, { name: newTag });
            message.success('Tag updated successfully');
        } else {
            await api.post('/api/admin/tags', { name: newTag });
            message.success('Tag created successfully');
        }
        setNewTag('');
        setEditingTag(null);
        setIsModalVisible(false);
        fetchTags();
        } catch (error) {
        message.error(error.response?.data?.message || 'Failed to save tag');
        }
    };
    
    const handleDeleteTag = async (id) => {
        try {
        await api.delete(`/api/admin/tags/${id}`);
        message.success('Tag deleted successfully');
        fetchTags();
        } catch (error) {
        message.error(error.response?.data?.message || 'Failed to delete tag');
        }
    };
    
    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        {
        title: 'Actions',
        key: 'actions',
        render: (text, record) => (
            <span>
            <Button
                icon={<EditOutlined />}
                onClick={() => {
                setEditingTag(record);
                setNewTag(record.name);
                setIsModalVisible(true);
                }}
            />  
            <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDeleteTag(record._id)}
                style={{ marginLeft: 8 }}
            />  
            </span>
        )
    }
    ];  
    return (
        <div>
            <h2>Admin Tags Management</h2>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                    setEditingTag(null);
                    setNewTag('');
                    setIsModalVisible(true);
                }}
                style={{ marginBottom: 16 }}
            >
                Add New Tag
            </Button>
            <Table
                dataSource={tags}
                columns={columns}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
            />
            <Modal
                title={editingTag ? 'Edit Tag' : 'Create New Tag'}
                open={isModalVisible}
                onOk={handleCreateOrUpdateTag}
                onCancel={() => setIsModalVisible(false)}
            >
                <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter tag name"
                />
            </Modal>
        </div>
    );  
}

export default AdminTags;