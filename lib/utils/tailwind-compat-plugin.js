// Tailwind CSS兼容性插件
// 提供兼容性更好的CSS类替代方案

const plugin = require('tailwindcss/plugin')

module.exports = plugin(function({ addUtilities, theme }) {
  // 添加兼容性更好的背景色混合工具类
  addUtilities({
    // 替代 color-mix() 的背景色类
    '.bg-black-50-compat': {
      'background-color': 'rgba(0, 0, 0, 0.5)',
    },
    '.bg-black-90-compat': {
      'background-color': 'rgba(0, 0, 0, 0.9)',
    },
    '.bg-white-50-compat': {
      'background-color': 'rgba(255, 255, 255, 0.5)',
    },
    '.bg-white-90-compat': {
      'background-color': 'rgba(255, 255, 255, 0.9)',
    },
    
    // 替代 text-wrap 的文本换行类
    '.text-wrap-compat': {
      'white-space': 'normal',
      'word-wrap': 'break-word',
      'overflow-wrap': 'break-word',
      'hyphens': 'auto',
      '-webkit-hyphens': 'auto',
      '-moz-hyphens': 'auto',
      '-ms-hyphens': 'auto',
    },
    '.text-nowrap-compat': {
      'white-space': 'nowrap',
    },
    '.text-balance-compat': {
      'text-align': 'justify',
      'hyphens': 'auto',
      '-webkit-hyphens': 'auto',
      '-moz-hyphens': 'auto',
      '-ms-hyphens': 'auto',
    },
    
    // 替代 field-sizing 的表单控件类
    '.field-sizing-compat': {
      'box-sizing': 'border-box',
      'width': '100%',
    },
    
    // 安全的文本大小调整
    '.text-size-adjust-compat': {
      'text-size-adjust': '100%',
      '-webkit-text-size-adjust': '100%',
      '-moz-text-size-adjust': '100%',
      '-ms-text-size-adjust': '100%',
    },
    
    // 兼容的flex布局
    '.flex-compat': {
      'display': '-webkit-box',
      'display': '-webkit-flex',
      'display': '-ms-flexbox',
      'display': 'flex',
    },
    '.inline-flex-compat': {
      'display': '-webkit-inline-box',
      'display': '-webkit-inline-flex',
      'display': '-ms-inline-flexbox',
      'display': 'inline-flex',
    },
    
    // 兼容的grid布局（在不支持的浏览器中降级为flex）
    '.grid-compat': {
      'display': 'flex',
      'flex-wrap': 'wrap',
      '@supports (display: grid)': {
        'display': 'grid',
      },
    },
    
    // 兼容的变换效果
    '.transform-compat': {
      '-webkit-transform': 'var(--tw-transform)',
      '-moz-transform': 'var(--tw-transform)',
      '-ms-transform': 'var(--tw-transform)',
      'transform': 'var(--tw-transform)',
    },
    
    // 兼容的过渡效果
    '.transition-compat': {
      '-webkit-transition': 'var(--tw-transition)',
      '-moz-transition': 'var(--tw-transition)',
      '-ms-transition': 'var(--tw-transition)',
      'transition': 'var(--tw-transition)',
    },
    
    // 兼容的滤镜效果
    '.filter-compat': {
      '-webkit-filter': 'var(--tw-filter)',
      'filter': 'var(--tw-filter)',
    },
    
    // 兼容的backdrop-filter效果
    '.backdrop-filter-compat': {
      '@supports (backdrop-filter: blur(1px))': {
        '-webkit-backdrop-filter': 'var(--tw-backdrop-filter)',
        'backdrop-filter': 'var(--tw-backdrop-filter)',
      },
    },
  })
  
  // 添加响应式修饰符
  addUtilities({
    // 移动设备优化
    '@media (max-width: 768px)': {
      '.mobile-touch-target': {
        'min-height': '44px',
        'min-width': '44px',
      },
    },
    
    // 高对比度模式支持
    '@media (prefers-contrast: high)': {
      '.high-contrast-border': {
        'border-color': 'CanvasText !important',
      },
      '.high-contrast-bg': {
        'background-color': 'Canvas !important',
        'color': 'CanvasText !important',
      },
    },
    
    // 减少动画模式
    '@media (prefers-reduced-motion: reduce)': {
      '.motion-reduce': {
        'animation': 'none !important',
        'transition': 'none !important',
      },
    },
    
    // 打印优化
    '@media print': {
      '.print-hidden': {
        'display': 'none !important',
      },
      '.print-visible': {
        'display': 'block !important',
      },
      '.print-text-black': {
        'color': 'black !important',
      },
      '.print-bg-white': {
        'background': 'white !important',
      },
    },
  })
})