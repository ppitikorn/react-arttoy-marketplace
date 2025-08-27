// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  // ignore ทั่วไป
  { ignores: ['dist', 'build', 'coverage', 'node_modules'] },

  // กฎสำหรับโค้ด Frontend React (ไฟล์ .js/.jsx)
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      // base + react + hooks
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      // ปรับกฎให้เข้ากับโปรเจกต์
      'react/prop-types': 'off', // ปิด prop-types ชั่วคราว (จะใช้ TS หรือค่อยมาใส่ทีหลังได้)
      'react/jsx-no-target-blank': 'off',

      // ลบ import ที่ไม่ได้ใช้แบบอัตโนมัติ + ผ่อนปรนตัวแปร/อาร์กิวเมนต์ที่ตั้งใจไม่ใช้ (ขึ้นต้นด้วย _)
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // fast refresh แค่เตือนพอ
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ทางเลือก: ผ่อน no-constant-binary-expression ถ้ากระทบโค้ดเดิมเยอะ
      // 'no-constant-binary-expression': 'off',
    },
  },

  // กฎเฉพาะไฟล์ที่รันด้วย Node (เช่น ไฟล์ทดสอบ/สคริปต์)
  {
    files: [
      'test_model.js',
      '**/*.config.js',
      'scripts/**/*.{js,jsx}', // ถ้ามี
    ],
    languageOptions: {
      globals: { ...globals.node }, // บอก ESLint ว่าไฟล์พวกนี้รันใน Node
      sourceType: 'module',
    },
    rules: {
      // ในไฟล์ Node อาจยังมี require/module.exports:
      // ถ้าใช้ ESM ทั้งหมดแล้วไม่ต้องแก้ส่วนนี้
      // ถ้าไฟล์ยังเป็น CommonJS ให้เปิด rule ด้านล่าง (และตั้ง sourceType ให้เหมาะ)
      // 'n/no-unsupported-features/es-syntax': 'off',
    },
  },
]
