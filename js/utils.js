// 工具函数模块

/**
 * 生成唯一ID
 * @returns {string} 唯一标识符
 */
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 生成UUID
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 复制是否成功
 */
function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    if (!navigator.clipboard) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        resolve(successful);
      } catch (err) {
        document.body.removeChild(textArea);
        reject(err);
      }
    } else {
      // 现代浏览器方案
      navigator.clipboard.writeText(text)
        .then(() => resolve(true))
        .catch(err => reject(err));
    }
  });
}

/**
 * 复制HTML到剪贴板
 * @param {string} html - HTML内容
 * @param {string} text - 纯文本内容
 * @returns {Promise<boolean>} 复制是否成功
 */
function copyHTMLToClipboard(html, text) {
  return new Promise((resolve, reject) => {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      reject(new Error('不支持HTML复制'));
      return;
    }

    const blob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([text], { type: 'text/plain' });
    
    const item = new ClipboardItem({
      'text/html': blob,
      'text/plain': textBlob
    });

    navigator.clipboard.write([item])
      .then(() => resolve(true))
      .catch(err => reject(err));
  });
}

/**
 * 显示通知消息
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 ('info', 'success', 'warning', 'error')
 * @param {number} duration - 显示时长（毫秒）
 */
function showNotification(message, type = 'info', duration = 3000) {
  // 移除已存在的通知
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-icon">${getNotificationIcon(type)}</div>
    <div class="notification-message">${message}</div>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;

  // 添加到页面
  document.body.appendChild(notification);

  // 自动移除
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutBottom 0.3s ease-out';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, duration);
  }

  return notification;
}

/**
 * 获取通知图标
 * @param {string} type - 通知类型
 * @returns {string} 图标HTML
 */
function getNotificationIcon(type) {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  return icons[type] || icons.info;
}

/**
 * 显示进度通知
 * @param {string} message - 消息
 * @param {number} progress - 进度（0-100）
 * @returns {HTMLElement} 通知元素
 */
function showProgressNotification(message, progress = 0) {
  const notification = document.createElement('div');
  notification.className = 'notification progress';
  notification.innerHTML = `
    <div class="notification-message">${message}</div>
    <div class="notification-progress">
      <div class="progress-bar" style="width: ${progress}%"></div>
    </div>
  `;

  document.body.appendChild(notification);
  return notification;
}

/**
 * 更新进度通知
 * @param {HTMLElement} notification - 通知元素
 * @param {number} progress - 进度（0-100）
 */
function updateProgressNotification(notification, progress) {
  const progressBar = notification.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 深度克隆对象
 * @param {Object} obj - 要克隆的对象
 * @returns {Object} 克隆后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 浅拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
function shallowClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return [...obj];
  return { ...obj };
}

/**
 * 合并对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @param {boolean} deep - 是否深度合并
 * @returns {Object} 合并后的对象
 */
function mergeObjects(target, source, deep = false) {
  if (!target || !source) return target || source;
  
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (deep && typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = mergeObjects(target[key], source[key], deep);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * 格式化日期时间
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串 ('YYYY-MM-DD HH:mm:ss')
 * @returns {string} 格式化后的日期字符串
 */
function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 验证输入内容
 * @param {string} content - 要验证的内容
 * @param {number} minLength - 最小长度
 * @param {number} maxLength - 最大长度
 * @returns {Object} 验证结果 { isValid: boolean, message: string }
 */
function validateContent(content, minLength = 1, maxLength = 500) {
  if (!content || typeof content !== 'string') {
    return {
      isValid: false,
      message: '内容不能为空'
    };
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length < minLength) {
    return {
      isValid: false,
      message: `内容至少需要 ${minLength} 个字符`
    };
  }

  if (trimmedContent.length > maxLength) {
    return {
      isValid: false,
      message: `内容不能超过 ${maxLength} 个字符`
    };
  }

  return {
    isValid: true,
    message: ''
  };
}

/**
 * 验证邮箱地址
 * @param {string} email - 邮箱地址
 * @returns {Object} 验证结果 { isValid: boolean, message: string }
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return {
      isValid: false,
      message: '邮箱地址不能为空'
    };
  }
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: '邮箱地址格式不正确'
    };
  }
  
  return {
    isValid: true,
    message: ''
  };
}

/**
 * 验证URL
 * @param {string} url - URL地址
 * @returns {Object} 验证结果 { isValid: boolean, message: string }
 */
function validateURL(url) {
  try {
    new URL(url);
    return {
      isValid: true,
      message: ''
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'URL格式不正确'
    };
  }
}

/**
 * 验证手机号码
 * @param {string} phone - 手机号码
 * @returns {Object} 验证结果 { isValid: boolean, message: string }
 */
function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phone) {
    return {
      isValid: false,
      message: '手机号码不能为空'
    };
  }
  
  if (!phoneRegex.test(phone)) {
    return {
      isValid: false,
      message: '手机号码格式不正确'
    };
  }
  
  return {
    isValid: true,
    message: ''
  };
}

/**
 * 安全的JSON解析
 * @param {string} jsonString - JSON字符串
 * @param {*} defaultValue - 解析失败时的默认值
 * @returns {*} 解析后的值或默认值
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON解析失败:', error);
    return defaultValue;
  }
}

/**
 * 获取元素相对于视口的位置
 * @param {HTMLElement} element - DOM元素
 * @returns {Object} 位置信息 { x: number, y: number }
 */
function getElementViewportPosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY
  };
}

/**
 * 检查元素是否在视口中
 * @param {HTMLElement} element - DOM元素
 * @param {number} threshold - 阈值 (0-1)
 * @returns {boolean} 是否在视口中
 */
function isElementInViewport(element, threshold = 0) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const verticalVisible = rect.top <= windowHeight * (1 - threshold) &&
                         rect.bottom >= windowHeight * threshold;
  const horizontalVisible = rect.left <= windowWidth * (1 - threshold) &&
                            rect.right >= windowWidth * threshold;

  return verticalVisible && horizontalVisible;
}

/**
 * 滚动到元素
 * @param {HTMLElement} element - 目标元素
 * @param {Object} options - 滚动选项
 */
function scrollToElement(element, options = {}) {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  element.scrollIntoView(finalOptions);
}

/**
 * 获取元素相对于文档的位置
 * @param {HTMLElement} element - DOM元素
 * @returns {Object} 位置信息 { x: number, y: number }
 */
function getElementDocumentPosition(element) {
  const rect = element.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  return {
    x: rect.left + scrollLeft,
    y: rect.top + scrollTop
  };
}

/**
 * 获取元素的尺寸信息
 * @param {HTMLElement} element - DOM元素
 * @returns {Object} 尺寸信息 { width: number, height: number }
 */
function getElementSize(element) {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
}

/**
 * 检查元素是否可见
 * @param {HTMLElement} element - DOM元素
 * @returns {boolean} 是否可见
 */
function isElementVisible(element) {
  return element.offsetParent !== null &&
         element.style.display !== 'none' &&
         element.style.visibility !== 'hidden' &&
         isElementInViewport(element);
}

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateId,
    generateUUID,
    copyToClipboard,
    copyHTMLToClipboard,
    showNotification,
    showProgressNotification,
    updateProgressNotification,
    getNotificationIcon,
    debounce,
    throttle,
    deepClone,
    shallowClone,
    mergeObjects,
    formatDateTime,
    validateContent,
    validateEmail,
    validateURL,
    validatePhone,
    safeJsonParse,
    getElementViewportPosition,
    isElementInViewport,
    scrollToElement,
    getElementDocumentPosition,
    getElementSize,
    isElementVisible
  };
}