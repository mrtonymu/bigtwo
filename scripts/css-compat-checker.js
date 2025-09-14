#!/usr/bin/env node

/**
 * CSS兼容性检查和优化工具
 * 用于检查和修复项目中的CSS兼容性问题
 */

const fs = require('fs');
const path = require('path');

// CSS兼容性问题映射
const COMPAT_ISSUES = {
  '-webkit-text-size-adjust': {
    problem: 'webkit前缀在现代浏览器中不是必需的',
    solution: '使用 text-size-adjust 代替，并保留webkit前缀作为降级',
    severity: 'warning'
  },
  'field-sizing': {
    problem: '较新的CSS属性，浏览器支持有限',
    solution: '使用 box-sizing: border-box 作为降级方案',
    severity: 'error'
  },
  'color-mix(': {
    problem: 'CSS颜色混合函数支持有限',
    solution: '使用 rgba() 或 hsla() 作为降级方案',
    severity: 'error'
  },
  'text-wrap': {
    problem: '较新的CSS属性，浏览器支持有限',
    solution: '使用 white-space, word-wrap, overflow-wrap 作为降级',
    severity: 'warning'
  }
};

// 兼容性修复建议
const FIXES = {
  'color-mix(in srgb, #000 50%, transparent)': 'rgba(0, 0, 0, 0.5)',
  'color-mix(in srgb, #000 90%, transparent)': 'rgba(0, 0, 0, 0.9)',
  'field-sizing: content': 'box-sizing: border-box; width: 100%',
  'text-wrap: wrap': 'white-space: normal; word-wrap: break-word',
  'text-wrap: nowrap': 'white-space: nowrap',
  'text-wrap: balance': 'text-align: justify; hyphens: auto'
};

class CSSCompatChecker {
  constructor() {
    this.issues = [];
    this.fixed = [];
  }

  // 检查单个CSS文件
  checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        this.checkLine(line, index + 1, filePath);
      });
      
    } catch (error) {
      console.error(`无法读取文件 ${filePath}:`, error.message);
    }
  }

  // 检查单行CSS
  checkLine(line, lineNumber, filePath) {
    Object.keys(COMPAT_ISSUES).forEach(pattern => {
      if (line.includes(pattern)) {
        const issue = COMPAT_ISSUES[pattern];
        this.issues.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          pattern,
          ...issue
        });
      }
    });
  }

  // 生成兼容性修复CSS
  generateFixCSS() {
    const fixCSS = [
      '/* 自动生成的CSS兼容性修复 */',
      '/* 请将此CSS添加到您的样式表中 */',
      '',
    ];

    // 为每个发现的问题生成修复
    const uniquePatterns = [...new Set(this.issues.map(issue => issue.pattern))];
    
    uniquePatterns.forEach(pattern => {
      const issue = COMPAT_ISSUES[pattern];
      fixCSS.push(`/* 修复: ${issue.problem} */`);
      
      if (pattern === '-webkit-text-size-adjust') {
        fixCSS.push('* {');
        fixCSS.push('  text-size-adjust: 100%;');
        fixCSS.push('  -webkit-text-size-adjust: 100%;');
        fixCSS.push('  -moz-text-size-adjust: 100%;');
        fixCSS.push('  -ms-text-size-adjust: 100%;');
        fixCSS.push('}');
      } else if (pattern === 'field-sizing') {
        fixCSS.push('input, textarea, select {');
        fixCSS.push('  box-sizing: border-box;');
        fixCSS.push('  width: 100%;');
        fixCSS.push('}');
      } else if (pattern === 'color-mix(') {
        fixCSS.push('.bg-black\\/50 {');
        fixCSS.push('  background-color: rgba(0, 0, 0, 0.5) !important;');
        fixCSS.push('}');
        fixCSS.push('.bg-black\\/90 {');
        fixCSS.push('  background-color: rgba(0, 0, 0, 0.9) !important;');
        fixCSS.push('}');
      } else if (pattern === 'text-wrap') {
        fixCSS.push('.text-wrap {');
        fixCSS.push('  white-space: normal;');
        fixCSS.push('  word-wrap: break-word;');
        fixCSS.push('  overflow-wrap: break-word;');
        fixCSS.push('  hyphens: auto;');
        fixCSS.push('  -webkit-hyphens: auto;');
        fixCSS.push('}');
      }
      
      fixCSS.push('');
    });

    return fixCSS.join('\n');
  }

  // 生成报告
  generateReport() {
    console.log('\n🔍 CSS兼容性检查报告\n');
    console.log('=' * 50);
    
    if (this.issues.length === 0) {
      console.log('✅ 没有发现兼容性问题！');
      return;
    }

    // 按严重程度分组
    const errors = this.issues.filter(issue => issue.severity === 'error');
    const warnings = this.issues.filter(issue => issue.severity === 'warning');

    if (errors.length > 0) {
      console.log(`❌ 错误 (${errors.length}):`);
      errors.forEach(issue => {
        console.log(`  📁 ${issue.file}:${issue.line}`);
        console.log(`     问题: ${issue.problem}`);
        console.log(`     代码: ${issue.content}`);
        console.log(`     建议: ${issue.solution}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log(`⚠️  警告 (${warnings.length}):`);
      warnings.forEach(issue => {
        console.log(`  📁 ${issue.file}:${issue.line}`);
        console.log(`     问题: ${issue.problem}`);
        console.log(`     代码: ${issue.content}`);
        console.log(`     建议: ${issue.solution}\n`);
      });
    }

    console.log('📝 建议操作:');
    console.log('1. 运行 npm run css:fix 生成修复CSS');
    console.log('2. 将生成的CSS添加到您的全局样式表');
    console.log('3. 测试在目标浏览器中的兼容性');
  }

  // 扫描项目目录
  scanProject(projectPath = '.') {
    const cssFiles = this.findCSSFiles(projectPath);
    
    console.log(`📂 扫描 ${cssFiles.length} 个CSS文件...\n`);
    
    cssFiles.forEach(file => {
      console.log(`检查: ${file}`);
      this.checkFile(file);
    });
  }

  // 查找CSS文件
  findCSSFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        this.findCSSFiles(fullPath, files);
      } else if (item.endsWith('.css') || item.endsWith('.scss') || item.endsWith('.sass')) {
        files.push(fullPath);
      }
    });
    
    return files;
  }
}

// 主函数
function main() {
  const checker = new CSSCompatChecker();
  
  // 检查项目
  checker.scanProject();
  
  // 生成报告
  checker.generateReport();
  
  // 生成修复CSS
  if (checker.issues.length > 0) {
    const fixCSS = checker.generateFixCSS();
    fs.writeFileSync('css-compat-fixes-generated.css', fixCSS);
    console.log('\n📄 已生成修复CSS文件: css-compat-fixes-generated.css');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = CSSCompatChecker;