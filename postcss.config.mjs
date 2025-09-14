/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    // 添加 autoprefixer 支持更好的浏览器兼容性
    autoprefixer: {
      // 支持的浏览器范围
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'Chrome >= 60',
        'Firefox >= 60',
        'Safari >= 12',
        'Edge >= 79'
      ],
      // 移除过时的前缀
      remove: true,
      // 添加必要的前缀
      add: true,
      // 网格布局支持
      grid: 'autoplace'
    },
    // PostCSS 预设环境，提供现代CSS特性的降级
    'postcss-preset-env': {
      // 指定目标浏览器阶段
      stage: 2,
      // 启用的功能
      features: {
        // 禁用可能有问题的新特性
        'color-mix': false,
        // 'field-sizing': false, // 移除不存在的特性
        // 'text-wrap': false,    // 移除不存在的特性
        // 启用有用的特性
        'custom-properties': true,
        'nesting-rules': true
      },
      // 浏览器支持列表
      browsers: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'Chrome >= 60',
        'Firefox >= 60', 
        'Safari >= 12',
        'Edge >= 79'
      ]
    }
  },
}

export default config
