import { Select } from 'antd';


const TagsSelect = ({ value = [], onChange, availableTags }) => {
  const handleChange = (selectedValues) => {
    if (onChange) {
      onChange(selectedValues);
    }
  };

  const options = availableTags.map(tag => ({
    label: tag.name,
    value: tag._id // Using _id from MongoDB
  }));

  return (
    <Select
      mode="multiple"
      allowClear
      style={{ width: '100%' }}
      placeholder="Please select tags"
      value={value}
      onChange={handleChange}
      options={options}
      optionFilterProp="label"
      showSearch
      maxTagCount={5}
      maxTagTextLength={12}
    />
  );
};
export default TagsSelect;