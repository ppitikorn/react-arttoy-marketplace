import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';


const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, setUser } = useAuth();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalValues, setOriginalValues] = useState(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      bio: '',
      phoneNumber: '',
      avatar: '',
      avatarFile: null
      
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email address').required('Required'),
      bio: Yup.string(),
      phoneNumber: Yup.string()
        .matches(/^[0-9+()-\s]*$/, 'Invalid phone number format')
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number must not exceed 15 digits'),
      avatarFile: Yup.mixed()
        .test('fileSize', 'File too large', (value) => {
          if (!value) return true;
          return value.size <= 5000000; // 5MB
        })
        .test('fileFormat', 'Unsupported format', (value) => {
          if (!value) return true;
          return ['image/jpg', 'image/jpeg', 'image/png'].includes(value.type);
        })
    }),
  onSubmit: async (values) => {
      try {
        console.log('Submitting form with values:', values);
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('bio', values.bio || '');
        formData.append('phoneNumber', values.phoneNumber || '');

        if (values.avatarFile) {
          formData.append('avatarFile', values.avatarFile);
        }
        console.log('Form data:', formData);

        const response = await axios.put('http://localhost:5000/api/profile', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setUser(response.data);
        setIsEditing(false);
        setError('');
        setPreviewUrl(response.data.avatar || '');
        console.log('Profile updated successfully:', response.data);
      } catch (err) {
        console.error('Error updating profile:', err);
        setError(err.response?.data?.message || 'Failed to update profile');
      }
    },
  });


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      formik.setFieldValue('avatarFile', file);
      formik.setFieldTouched('avatarFile', true);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      console.log('File selected:', file);
      console.log('Preview URL:', url);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/profile')
        const profileData = response.data;
        console.log('Profile data fetched:', profileData);
        
        formik.setValues({
          name: profileData.name || '',
          email: profileData.email || '',
          bio: profileData.bio || '',
          phoneNumber: profileData.phoneNumber || '',
          avatar: profileData.avatar || '',
          emailVerified: profileData.emailVerified || false,
        });
        
        setPreviewUrl(profileData.avatar || '');
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch profile data');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleVerifyEmail = async () => {
    try {
      await axios.post('http://localhost:5000/api/profile/verify-email');
      // OTP verification logic can be added here
      //setUser({ ...user, emailVerified: true });
      console.log('Verification email sent');
    } catch (err) {
      setError('Failed to send verification email');
    }
  };

  const handleStartEditing = () => {
    // Store original values before editing
    setOriginalValues({
      name: formik.values.name,
      bio: formik.values.bio,
      phoneNumber: formik.values.phoneNumber,
      avatar: formik.values.avatar,
      avatarFile: null
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset to original values
    if (originalValues) {
      formik.setValues({
        ...formik.values,
        ...originalValues
      });
      setPreviewUrl(originalValues.avatar);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <div className="relative">
                <img
                  className="h-32 w-32 rounded-full object-cover border-4 border-gray-700"
                  src={previewUrl || formik.values.avatar}
                  alt={formik.values.name}
                />
                {isEditing && (
                  <div className="absolute bottom-0 right-0">
                    <label htmlFor="avatar" className="cursor-pointer">
                      <div className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </div>
                      <input
                        type="file"
                        id="avatar"
                        name="avatar"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={!isEditing}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            {formik.values.emailVerified ? <div className="mt-6 bg-green-900/50 border border-green-700 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-500">
                    Email verified successfully 
                  </p>
                </div>
              </div> :
              <div className="mt-6 bg-yellow-900/50 border border-yellow-700 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-yellow-500">
                    Please verify your email address
                  </p>
                  <button
                    onClick={handleVerifyEmail}
                    className="text-sm text-yellow-500 hover:text-yellow-400 font-medium"
                  >
                    Verify Now
                  </button>
                </div>
              </div>
              }

            <form onSubmit={formik.handleSubmit} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="mt-2 text-sm text-red-500">{formik.errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    disabled={true}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-2 text-sm text-red-500">{formik.errors.email}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-300">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="4"
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formik.values.bio}
                    onChange={formik.handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    inputMode="numeric"
                    id="phoneNumber"
                    name="phoneNumber"
                    pattern="[0-9]*"
                    placeholder="1234567890"
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formik.values.phoneNumber}
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                      formik.handleChange(e);
                    }}
                  />
                  {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                    <p className="mt-2 text-sm text-red-500">{formik.errors.phoneNumber}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>                    
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;