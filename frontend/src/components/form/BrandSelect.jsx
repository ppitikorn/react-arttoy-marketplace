// import { useState, useEffect } from 'react';
// import { Cascader } from 'antd';

// const transformDataForCascader = (data) => {
//     if (!data?.length) return [];

//     const dataMap = new Map();
//     const roots = [];

//     // Initialize map with transformed nodes
//     data.forEach(item => {
//         dataMap.set(item._id, {
//             value: item._id,
//             label: item.name,
//             slug: item.slug,
//             children: []
//         });
//     });

//     // Build the tree structure
//     data.forEach(item => {
//         const node = dataMap.get(item._id);
//         if (item.parent) {
//             const parentNode = dataMap.get(item.parent);
//             if (parentNode) {
//                 parentNode.children.push(node);
//             } else {
//                 roots.push(node);
//             }
//         } else {
//             roots.push(node);
//         }
//     });

//     // Clean up empty children arrays
//     const cleanChildren = (nodes) => {
//         nodes.forEach(node => {
//             if (node.children.length === 0) {
//                 delete node.children;
//             } else {
//                 cleanChildren(node.children);
//             }
//         });
//     };

//     cleanChildren(roots);
//     return roots;
// };

// // const BrandCascader = ({ apiData, onChange: onChangeCallback, value }) => {
// //     const [selectedValue, setSelectedValue] = useState([]);
// //     const [options, setOptions] = useState([]);

// //     useEffect(() => {
// //         const transformedOptions = transformDataForCascader(apiData);
// //         setOptions(transformedOptions);
// //     }, [apiData]);

// //     useEffect(() => {
// //         if (value) {
// //             // Find the path to the selected value
// //             const findPath = (opts, targetId) => {
// //                 for (const opt of opts) {
// //                     if (opt.value === targetId) {
// //                         return [opt.value];
// //                     }
// //                     if (opt.children) {
// //                         const path = findPath(opt.children, targetId);
// //                         if (path) {
// //                             return [opt.value, ...path];
// //                         }
// //                     }
// //                 }
// //                 return null;
// //             };

// //             const path = findPath(options, value);
// //             if (path) {
// //                 setSelectedValue(path);
// //             }
// //         }
// //     }, [value, options]);

// //     const handleChange = (selectedValue, selectedOptions) => {
// //         setSelectedValue(selectedValue);
        
// //         if (selectedOptions?.length > 0) {
// //             const lastSelected = selectedOptions[selectedOptions.length - 1];
// //             // Just send the value (ID) directly
// //             onChangeCallback?.(lastSelected.value);
// //         }
// //     };

// //     return (
// //         <Cascader
// //             options={options}
// //             value={selectedValue}
// //             onChange={handleChange}
// //             placeholder="Please select brand"
// //             style={{ width: '100%' }}
// //             changeOnSelect
// //         />
// //     );
// // };

// // const BrandSelect = ({ onBrandSelect, brands, value }) => {
// //     const handleBrandChange = (selectedValue) => {
// //         if (onBrandSelect && typeof onBrandSelect === 'function') {
// //             onBrandSelect(selectedValue);
// //         }
// //     };

// //     return (
// //         <BrandCascader
// //             apiData={brands}
// //             onChange={handleBrandChange}
// //             value={value}
// //         />
// //     );
// // };

// // export default BrandSelect;
// const BrandCascader = ({ apiData, onChange, value }) => {
//     const [selectedValue, setSelectedValue] = useState([]);
//     const [options, setOptions] = useState([]);

//     useEffect(() => {
//         const transformedOptions = transformDataForCascader(apiData);
//         setOptions(transformedOptions);
//     }, [apiData]);

//     useEffect(() => {
//         if (value) {
//             const findPath = (opts, targetId) => {
//                 for (const opt of opts) {
//                     if (opt.value === targetId) {
//                         return [opt.value];
//                     }
//                     if (opt.children) {
//                         const path = findPath(opt.children, targetId);
//                         if (path) {
//                             return [opt.value, ...path];
//                         }
//                     }
//                 }
//                 return null;
//             };

//             const path = findPath(options, value);
//             if (path) {
//                 setSelectedValue(path);
//             }
//         }
//     }, [value, options]);

//     const handleChange = (selectedValue, selectedOptions) => {
//         setSelectedValue(selectedValue);
//         if (selectedOptions?.length > 0) {
//             const lastSelected = selectedOptions[selectedOptions.length - 1];
//             onChange(lastSelected.value);
//         }
//     };

//     return (
//         <Cascader
//             options={options}
//             value={selectedValue}
//             onChange={handleChange}
//             defaultValue={selectedValue}
//             placeholder="Please select brand"
//             style={{ width: '100%' }}
//             changeOnSelect
//         />
//     );
// };

// const BrandSelect = ({ onChange, brands, value }) => (
//     <BrandCascader
//         apiData={brands}
//         onChange={onChange}
//         value={value}
//     />
// );

// export default BrandSelect;
import { useState, useEffect } from 'react';
import { Cascader } from 'antd';

const transformDataForCascader = (data) => {
  if (!data?.length) return [];

  const dataMap = new Map();
  const roots = [];

  // map ทุก node
  data.forEach(item => {
    dataMap.set(item._id, {
      value: item._id,
      label: item.name,
      slug: item.slug,
      children: []
    });
  });

  // build tree
  data.forEach(item => {
    const node = dataMap.get(item._id);
    if (item.parent) {
      const parentNode = dataMap.get(item.parent);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // clean
  const cleanChildren = (nodes) => {
    nodes.forEach(node => {
      if (!node.children.length) {
        delete node.children;
      } else {
        cleanChildren(node.children);
      }
    });
  };
  cleanChildren(roots);

  return roots;
};

const BrandCascader = ({ apiData, value, onChange }) => {
  const [selectedValue, setSelectedValue] = useState([]);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    setOptions(transformDataForCascader(apiData));
  }, [apiData]);

  // sync value จาก parent → path
  useEffect(() => {
    if (value) {
      const findPath = (opts, targetId) => {
        for (const opt of opts) {
          if (opt.value === targetId) return [opt.value];
          if (opt.children) {
            const path = findPath(opt.children, targetId);
            if (path) return [opt.value, ...path];
          }
        }
        return null;
      };
      const path = findPath(options, value);
      if (path) setSelectedValue(path);
    } else {
      setSelectedValue([]);
    }
  }, [value, options]);

  const handleChange = (selectedValue, selectedOptions) => {
    setSelectedValue(selectedValue);
    if (selectedOptions?.length > 0) {
      const lastSelected = selectedOptions[selectedOptions.length - 1];
      onChange?.(lastSelected.value); // ✅ ส่งออกเหมือน Select
    } else {
      onChange?.(null); // ✅ clear ได้
    }
  };

  return (
    <Cascader
      options={options}
      value={selectedValue}
      onChange={handleChange}
      placeholder="Please select brand"
      style={{ width: '100%' }}
      changeOnSelect
      allowClear
    />
  );
};

const BrandSelect = ({ brands, value, onChange }) => (
  <BrandCascader apiData={brands} value={value} onChange={onChange} />
);

export default BrandSelect;
