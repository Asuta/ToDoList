// 文件存储管理模块

class FileStorageManager {
  constructor() {
    this.fileName = 'data.json';
    this.backupFileName = 'data_backup.json';
    this.autoSaveTimer = null;
    this.autoSaveDelay = 2000; // 2秒自动保存
    this.isSaving = false;
    this.saveQueue = [];
  }

  /**
   * 从JSON文件加载数据
   * @returns {Promise<Object>} 数据对象
   */
  async loadData() {
    try {
      // 检查localStorage中是否有数据（兼容性处理）
      const localStorageData = this.loadFromLocalStorage();
      if (localStorageData) {
        console.log('从localStorage加载数据（兼容模式）');
        return localStorageData;
      }

      // 尝试从JSON文件加载数据
      const response = await this.fetchFile(this.fileName);
      if (response.ok) {
        const data = await response.json();
        console.log('从JSON文件加载数据成功');
        return this.validateData(data) ? data : this.getDefaultData();
      } else if (response.status === 404) {
        console.log('JSON文件不存在，使用默认数据');
        return this.getDefaultData();
      } else {
        throw new Error(`加载文件失败: ${response.status}`);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      // 如果文件加载失败，尝试从localStorage恢复
      const localStorageData = this.loadFromLocalStorage();
      if (localStorageData) {
        console.log('从localStorage恢复数据');
        return localStorageData;
      }
      return this.getDefaultData();
    }
  }

  /**
   * 保存数据到JSON文件
   * @param {Object} data - 要保存的数据
   * @returns {Promise<boolean>} 保存是否成功
   */
  async saveData(data) {
    try {
      this.isSaving = true;
      
      // 添加到保存队列
      return new Promise((resolve) => {
        this.saveQueue.push({ data, resolve });
        
        // 如果没有正在保存的定时器，则启动
        if (!this.autoSaveTimer) {
          this.processSaveQueue();
        }
      });
    } catch (error) {
      console.error('保存数据失败:', error);
      this.isSaving = false;
      return false;
    }
  }

  /**
   * 处理保存队列
   */
  async processSaveQueue() {
    if (this.saveQueue.length === 0) {
      this.isSaving = false;
      this.autoSaveTimer = null;
      return;
    }

    const { data, resolve } = this.saveQueue.shift();
    
    try {
      const success = await this.writeToFile(this.fileName, data);
      if (success) {
        // 同时保存到localStorage（兼容性）
        this.saveToLocalStorage(data);
        resolve(true);
        
        // 显示保存成功通知
        this.showSaveNotification('数据已保存到文件', 'success');
      } else {
        resolve(false);
        this.showSaveNotification('保存到文件失败', 'error');
      }
    } catch (error) {
      console.error('保存数据到文件失败:', error);
      resolve(false);
      this.showSaveNotification('保存到文件失败', 'error');
    }

    // 处理队列中的下一个保存请求
    if (this.saveQueue.length > 0) {
      setTimeout(() => this.processSaveQueue(), 100);
    } else {
      this.isSaving = false;
      this.autoSaveTimer = null;
    }
  }

  /**
   * 手动保存数据
   * @param {Object} data - 要保存的数据
   * @returns {Promise<boolean>} 保存是否成功
   */
  async manualSave(data) {
    try {
      const success = await this.writeToFile(this.fileName, data);
      if (success) {
        this.saveToLocalStorage(data);
        this.showSaveNotification('数据已手动保存', 'success');
        return true;
      } else {
        this.showSaveNotification('手动保存失败', 'error');
        return false;
      }
    } catch (error) {
      console.error('手动保存失败:', error);
      this.showSaveNotification('手动保存失败', 'error');
      return false;
    }
  }

  /**
   * 从文件加载数据
   * @param {string} fileName - 文件名
   * @returns {Promise<Object>} 数据对象
   */
  async loadDataFromFile(fileName) {
    try {
      const response = await this.fetchFile(fileName);
      if (response.ok) {
        const data = await response.json();
        return this.validateData(data) ? data : null;
      }
      return null;
    } catch (error) {
      console.error('从文件加载数据失败:', error);
      return null;
    }
  }

  /**
   * 从文件导入数据
   * @param {File} file - 文件对象
   * @returns {Promise<Object>} 导入的数据
   */
  async importDataFromFile(file) {
    try {
      const text = await this.readFileAsText(file);
      const data = JSON.parse(text);
      return this.validateData(data) ? data : null;
    } catch (error) {
      console.error('导入文件失败:', error);
      throw new Error('文件格式不正确或数据损坏');
    }
  }

  /**
   * 备份数据
   * @returns {Promise<boolean>} 备份是否成功
   */
  async backupData() {
    try {
      const data = await this.loadData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `data_backup_${timestamp}.json`;
      
      const success = await this.writeToFile(backupFileName, data);
      if (success) {
        this.showSaveNotification('数据备份成功', 'success');
        return true;
      } else {
        this.showSaveNotification('数据备份失败', 'error');
        return false;
      }
    } catch (error) {
      console.error('备份数据失败:', error);
      this.showSaveNotification('数据备份失败', 'error');
      return false;
    }
  }

  /**
   * 恢复数据
   * @param {string} fileName - 备份文件名
   * @returns {Promise<boolean>} 恢复是否成功
   */
  async restoreData(fileName) {
    try {
      const data = await this.loadDataFromFile(fileName);
      if (data) {
        const success = await this.writeToFile(this.fileName, data);
        if (success) {
          this.saveToLocalStorage(data);
          this.showSaveNotification('数据恢复成功', 'success');
          return true;
        }
      }
      this.showSaveNotification('数据恢复失败', 'error');
      return false;
    } catch (error) {
      console.error('恢复数据失败:', error);
      this.showSaveNotification('数据恢复失败', 'error');
      return false;
    }
  }

  /**
   * 获取备份文件列表
   * @returns {Promise<Array>} 备份文件列表
   */
  async getBackupList() {
    try {
      // 由于浏览器限制，这里简化实现
      // 在实际应用中，可能需要服务器端支持
      return [];
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  /**
   * 删除备份文件
   * @param {string} fileName - 文件名
   * @returns {Promise<boolean>} 删除是否成功
   */
  async deleteBackupFile(fileName) {
    try {
      // 由于浏览器限制，这里简化实现
      // 在实际应用中，可能需要服务器端支持
      this.showSaveNotification('删除备份文件功能需要服务器支持', 'info');
      return false;
    } catch (error) {
      console.error('删除备份文件失败:', error);
      return false;
    }
  }

  /**
   * 获取文件存储信息
   * @returns {Object} 存储信息
   */
  getStorageInfo() {
    const dataStr = JSON.stringify(this.getDefaultData());
    const size = new Blob([dataStr]).size;
    
    return {
      size: size,
      sizeFormatted: this.formatFileSize(size),
      fileName: this.fileName,
      backupFileName: this.backupFileName,
      autoSaveEnabled: true,
      lastSaveTime: new Date().toISOString()
    };
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 显示保存通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型
   */
  showSaveNotification(message, type = 'info') {
    showNotification(message, type, 3000);
  }

  /**
   * 获取默认数据结构
   * @returns {Object} 默认数据
   */
  getDefaultData() {
    return {
      groups: [],
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      storageType: 'file'
    };
  }

  /**
   * 验证数据结构
   * @param {Object} data - 要验证的数据
   * @returns {boolean} 数据是否有效
   */
  validateData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.groups || !Array.isArray(data.groups)) return false;
    if (!data.version) return false;
    if (!data.lastUpdated) return false;
    
    // 验证组数据结构
    for (const group of data.groups) {
      if (!group.id || !group.name || !Array.isArray(group.items)) {
        return false;
      }
      
      // 验证条目数据结构
      for (const item of group.items) {
        if (!item.id || !item.content) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 从localStorage加载数据（兼容性）
   * @returns {Object|null} localStorage数据
   */
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('hierarchical_item_manager_data');
      if (savedData) {
        const data = JSON.parse(savedData);
        if (this.validateData(data)) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('从localStorage加载数据失败:', error);
      return null;
    }
  }

  /**
   * 保存数据到localStorage（兼容性）
   * @param {Object} data - 要保存的数据
   */
  saveToLocalStorage(data) {
    try {
      localStorage.setItem('hierarchical_item_manager_data', JSON.stringify(data));
    } catch (error) {
      console.error('保存到localStorage失败:', error);
    }
  }

  /**
   * 获取文件内容
   * @param {string} fileName - 文件名
   * @returns {Promise<Response>} 响应对象
   */
  async fetchFile(fileName) {
    try {
      const response = await fetch(fileName);
      return response;
    } catch (error) {
      // 如果是网络错误，返回404状态
      if (error.name === 'TypeError') {
        return { ok: false, status: 404 };
      }
      throw error;
    }
  }

  /**
   * 写入文件
   * @param {string} fileName - 文件名
   * @param {Object} data - 要写入的数据
   * @returns {Promise<boolean>} 写入是否成功
   */
  async writeToFile(fileName, data) {
    try {
      // 创建Blob对象
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // 清理URL
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('写入文件失败:', error);
      return false;
    }
  }

  /**
   * 读取文件为文本
   * @param {File} file - 文件对象
   * @returns {Promise<string>} 文件内容
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * 调度自动保存
   * @param {Object} data - 要保存的数据
   */
  scheduleAutoSave(data) {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setTimeout(() => {
      this.saveData(data);
    }, this.autoSaveDelay);
  }

  /**
   * 取消自动保存
   */
  cancelAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 检查文件存储可用性
   * @returns {Promise<boolean>} 是否可用
   */
  async checkAvailability() {
    try {
      // 检查是否支持必要的API
      return 'download' in HTMLAnchorElement.prototype && 
             'FileReader' in window &&
             'Blob' in window;
    } catch (error) {
      console.error('检查文件存储可用性失败:', error);
      return false;
    }
  }
}

// 导出FileStorageManager类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileStorageManager;
}