import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import BrandSelect from '../../components/form/BrandSelect';
import TagsSelect from '../../components/form/TagsSelect';
import { useAuth } from '../../context/AuthContext';
import { 
  Form, 
  Input, 
  Select, 
  Upload, 
  Button, 
  message, 
  Card, 
  Space,
  InputNumber,
  Typography,
  Spin,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

export default function ProductEdit() {
  const [form] = Form.useForm();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: '',
    brand: '',
    images: [],
    details: '',
    condition: '',
    rarity: '',
    tags: []
  });
  const [brands, setBrands] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const categories = [
    { label: 'Figure', value: 'Figure' },
    { label: 'Action Figure', value: 'Action Figure' },
    { label: 'Blind Box', value: 'Blind Box' },
    { label: 'Plush Toys', value: 'Plush Toys' },
    { label: 'Art Work', value: 'Art Work' },
    { label: 'Other', value: 'OTHER' }
  ];

  // Check if user is seller and can edit this product
  // Only run once on mount and when slug/user changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) {
      message.error('Please login to access this page');
      navigate('/login');
      return;
    }
    fetchProductData();
    fetchBrandsAndTags();
    // if (user.id !== productData?.seller.id) {
    //   console.error('Unauthorized access attempt by user:', user.id);
    //   console.error('Product data:', productData);
    //   console.error('Product owner:', productData?.seller.id);
    //   message.error('Only sellers can edit products');
    //   navigate('/');
    //   return;
    // }
    
  }, [slug, user]);

  const fetchProductData = async () => {
    try {
      setPageLoading(true);
      const response = await api.get(`/api/products/${slug}`);
      const productData = response.data;
      // Check if the current user is the owner of this product
      if (productData.seller._id !== user.id) {
        message.error('You can only edit your own products');
        navigate('/products');
        return;
      };
      setProduct(productData);

      // Transform existing images for the upload component
      const existingImageFiles = productData.images.map((imageUrl, index) => ({
        uid: `existing-${index}`,
        name: `image-${index}`,
        status: 'done',
        url: imageUrl,
        isExisting: true
      }));

      const initialFormData = {
        title: productData.title,
        price: productData.price,
        category: productData.category,
        brand: productData.brand._id,
        images: existingImageFiles,
        details: productData.details,
        condition: productData.condition,
        rarity: productData.rarity,
        tags: productData.tags.map(tag => tag._id)
      };

      setFormData(initialFormData);
      setExistingImages(existingImageFiles);
      form.setFieldsValue(initialFormData);
      
    } catch (error) {
      console.error('Error fetching product:', error);
      message.error('Failed to load product data');
      navigate('/products');
    } finally {
      setPageLoading(false);
    }
  };

  const fetchBrandsAndTags = async () => {
    try {
      const [brandsRes, tagsRes] = await Promise.all([
        api.get('/api/brand/'),
        api.get('/api/tags')
      ]);
      setBrands(brandsRes.data);
      setAvailableTags(tagsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load brands and tags');
    }
  };

  const handleImageChange = ({ fileList }) => {
    if (fileList.length > 4) {
      message.error('Maximum 4 images allowed');
      return;
    }

    // Separate existing and new images
    const existing = fileList.filter(file => file.isExisting);
    const newFiles = fileList.filter(file => !file.isExisting);

    setExistingImages(existing);
    setNewImages(newFiles.map(file => file.originFileObj).filter(Boolean));
    setFormData(prev => ({ ...prev, images: fileList }));
  };

  const handleImageRemove = (file) => {
    if (file.isExisting) {
      // Mark existing image for deletion
      setImagesToDelete(prev => [...prev, file.url]);
    }
    return true;
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Append all the form fields
      formDataToSend.append('title', values.title);
      formDataToSend.append('price', values.price);
      formDataToSend.append('category', values.category);
      formDataToSend.append('brand', values.brand);
      formDataToSend.append('details', values.details);
      formDataToSend.append('condition', values.condition);
      formDataToSend.append('rarity', values.rarity);
      
      // Append tags
      if (values.tags && values.tags.length > 0) {
        values.tags.forEach(tag => {
          formDataToSend.append('tags', tag);
        });
      }

      // Append new images
      if (newImages && newImages.length > 0) {
        newImages.forEach(file => {
          formDataToSend.append('newImages', file);
        });
      }

      // Append existing images to keep
      const existingImagesToKeep = existingImages
        .filter(img => !imagesToDelete.includes(img.url))
        .map(img => img.url);
      
      existingImagesToKeep.forEach(imageUrl => {
        formDataToSend.append('existingImages', imageUrl);
      });

      // Append images to delete
      imagesToDelete.forEach(imageUrl => {
        formDataToSend.append('imagesToDelete', imageUrl);
      });
      //console.log('Form data to send:', formDataToSend);
      const response = await api.put(
        `/api/products/${slug}`, 
        formDataToSend, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      //console.log('Product updated:', response.data);
      
      message.success('Product updated successfully');
      navigate(`/products/${slug}`); // Redirect to product detail page
      
    } catch (error) {
      console.error('Error updating product:', error);

      message.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    confirm({
      title: 'Are you sure you want to delete this product?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`/api/products/${slug}`);
          message.success('Product deleted successfully');
          navigate('/products');
        } catch (error) {
          console.error('Error deleting product:', error);
          message.error('Failed to delete product');
        }
      },
    });
  };

  const onValuesChange = (changedValues, allValues) => {
    setFormData(prev => ({
      ...prev,
      ...changedValues
    }));
    //console.log('Form values changed:', changedValues);
  };

  if (pageLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f0f2f5', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '24px' }}>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Edit Product</Title>
          <Button 
            danger 
            onClick={handleDelete}
            icon={<DeleteOutlined />}
          >
            Delete Product
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={formData}
          onValuesChange={onValuesChange}
        >
          <Form.Item
            label="Product Images"
            name="images"
            rules={[{ required: true, message: 'Please upload at least one image' }]}
          >
            <Upload
              accept="image/*"
              multiple
              name="images"
              listType="picture-card"
              fileList={formData.images}
              onChange={handleImageChange}
              onRemove={handleImageRemove}
              beforeUpload={() => false}
              maxCount={4}
              showUploadList={{ showPreviewIcon: false, showRemoveIcon: true }}
            >
              {formData.images.length >= 4 ? null : uploadButton}
            </Upload>
          </Form.Item>

          <Form.Item
            label="Product Title"
            name="title"
            rules={[{ required: true, message: 'Please enter product title' }]}
          >
            <Input placeholder="Enter product title" />
          </Form.Item>

          <Space style={{ width: '100%' }} direction="vertical" size="large">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select placeholder="Select Category">
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
              </Form.Item>              <Form.Item
                label="Brand"
                name="brand"
                rules={[{ required: true, message: 'Please select a brand' }]}
              >
                <BrandSelect
                  brands={brands}
                  onChange={onValuesChange}
                  value={formData.brand}
                />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <Form.Item
                label="Condition"
                name="condition"
                rules={[{ required: true, message: 'Please select condition' }]}
              >
                <Select placeholder="Select Condition">
                  <Option value="Pre-owned">Pre-owned</Option>
                  <Option value="Brand New">Brand New</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Rarity"
                name="rarity"
                rules={[{ required: true, message: 'Please select rarity' }]}
              >
                <Select placeholder="Select Rarity">
                  <Option value="Common">Common</Option>
                  <Option value="Secret">Secret</Option>
                  <Option value="Limited">Limited Edition</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              label="Details"
              name="details"
              rules={[{ required: true, message: 'Please enter product details' }]}
            >
              <TextArea rows={4} placeholder="Enter product details" />
            </Form.Item>            

            <Form.Item
              label="Tags"
              name="tags"
              rules={[{ required: true, message: 'Please select at least one tag' }]}
            >
              <TagsSelect 
                availableTags={availableTags}
              />
            </Form.Item>

            <Form.Item
              label="Price (฿)"
              name="price"
              rules={[{ required: true, message: 'Please enter price' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="บาท"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Space>

          <Form.Item>
            <Space style={{ width: '100%' }} direction="vertical">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                style={{ width: '100%', height: '40px' }}
              >
                {isLoading ? 'Updating...' : 'Update Product'}
              </Button>
              <Button
                type="default"
                onClick={() => navigate(`/products/${slug}`)}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}