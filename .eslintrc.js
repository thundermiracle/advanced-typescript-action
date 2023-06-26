module.exports = {
  extends: [
    'plugin:@web-configs/node',
    'plugin:@web-configs/typescript',
    'plugin:@web-configs/prettier',
  ],
  rules: {
    'line-comment-position': 'off',
    '@typescript-eslint/naming-convention': 'off',
  },
};
