/** @type {import('jest').Config} */
module.exports = {
  // Название модуля для отображения в отчётах
  displayName: 'backend',

  // Использовать ts-jest для TypeScript
  preset: 'ts-jest',

  // Среда выполнения
  testEnvironment: 'node',

  // Корневая директория для тестов
  rootDir: '.',

  // Паттерны для поиска тестовых файлов
  // Тесты лежат в папках test/ рядом с компонентами: src/shared/test/
  testMatch: [
    '<rootDir>/src/**/test/*.test.ts',
    '<rootDir>/src/**/test/*.spec.ts',
    '<rootDir>/test/**/*.test.ts',
  ],

  // Игнорировать node_modules и dist
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Маппинг путей (алиасы)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Собирать информацию о покрытии кода
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
  ],

  // Директория для отчётов о покрытии
  coverageDirectory: './coverage',

  // Таймаут для тестов (мс)
  testTimeout: 10000,

  // Очищать моки между тестами
  clearMocks: true,

  // Verbose вывод
  verbose: true,
};

