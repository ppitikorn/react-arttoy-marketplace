import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import BrandSelect from '../../components/form/BrandSelect';
import TagsSelect from '../../components/form/TagsSelect';
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
  Typography
} from 'antd';
import { 
  PlusOutlined 
} from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function PostProduct() {
  const [form] = Form.useForm();
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
  const [previewUrls, setPreviewUrls] = useState([]);
  const [images, setImages] = useState([]);
  const navigate = useNavigate();
  // const [error, setError] = useState('');
  // const [price, setPrice] = useState("");

 
  const categories = [
    { label: 'Figure', value: 'Figure' },
    { label: 'Action Figure', value: 'Action Figure' },
    { label: 'Blind Box', value: 'Blind Box' },
    { label: 'Plush Toys', value: 'Plush Toys' },
    { label: 'Art Work', value: 'Art Work' },
    { label: 'Other', value: 'OTHER' }
  ];


  useEffect(() => {
    fetchBrandsAndTags();
  }, []);

  const fetchBrandsAndTags = async () => {
      try {
        const [BrandsRes, tagsRes] = await Promise.all([
          api.get('/api/brand/'),
          api.get('/api/tags')
        ]);
        setBrands(BrandsRes.data);
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
    
    const newPreviewUrls = fileList.map(file => {
      if (file.url) return file.url;
      return URL.createObjectURL(file.originFileObj);
    });
    
    setPreviewUrls(newPreviewUrls);
    setImages(fileList.map(file => file.originFileObj));
    setFormData(prev => ({ ...prev, images: fileList }));
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
      
      if (values.tags && values.tags.length > 0) {
        values.tags.forEach(tag => {
          formDataToSend.append('tags', tag);
        });
      }

      // Append each image file with the field name 'images'
      if (images && images.length > 0) {
        images.forEach(file => {
          formDataToSend.append('images', file);
        });
      }
      // Log the formDataToSend for debugging
      //console.log('FormData to send:', formDataToSend);
      const response = await api.post('/api/products', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      //console.log('Product created:', response.data);
      if(response.data.moderation.final === 'approved'){
        message.success(response.data.message);
      } else if (response.data.moderation.final === 'pending') {
        message.warning(response.data.message);
      }
      navigate('/products'); // Redirect to product list or detail page
      form.resetFields();
      setImages([]);
      setPreviewUrls([]);
      setFormData({
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
    } catch (error) {
      console.error('Error creating product:', error);
      message.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };
 
  const onValuesChange = (changedValues, allValues) => {
    setFormData(prev => ({
      ...prev,
      ...changedValues
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(254 249 195)', padding: '24px' }}>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24 }}>List Your Art Toy</Title>

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
              name='images'
              listType="picture-card"
              fileList={formData.images}
              onChange={handleImageChange}
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
              </Form.Item>

              <Form.Item
                label="Brand"
                name="brand"
                rules={[{ required: true, message: 'Please select a brand' }]}
              >
                <BrandSelect
                  brands={brands}
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
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              style={{ width: '100%', height: '40px', marginTop: '16px' }}
            >
              {isLoading ? 'Creating...' : 'List Product'}
            </Button>

          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}