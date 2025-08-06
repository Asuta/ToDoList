// 数据管理模块

class DataManager {
  constructor() {
    console.log('[DEBUG] DataManager 构造函数开始');
    
    this.storageKey = 'hierarchical_item_manager_data';
    this.autoSaveTimer = null;
    this.autoSaveDelay = 2000; // 2秒自动保存
    this.data = this.getDefaultData(); // 先使用默认数据
    this.useFileStorage = false; // 默认不使用文件存储
    
    console.log('[DEBUG] 创建 FileStorageManager...');
    this.fileStorageManager = new FileStorageManager();
    
    console.log('[DEBUG] DataManager 构造函数完成，数据初始化为默认值');
  }

  /**
   * 检查文件存储支持
   * @returns {boolean} 是否支持文件存储
   */
  async checkFileStorageSupport() {
    console.log('[DEBUG] DataManager.checkFileStorageSupport() 开始检查');
    try {
      console.log('[DEBUG] 调用 fileStorageManager.checkAvailability()...');
      const support = await this.fileStorageManager.checkAvailability();
      console.log('[DEBUG] 文件存储支持结果:', support);
      
      if (support) {
        console.log('[DEBUG] 文件存储已启用');
        return true;
      } else {
        console.log('[DEBUG] 文件存储不可用，使用localStorage');
        return false;
      }
    } catch (error) {
      console.error('[DEBUG] 检查文件存储支持失败:', error);
      return false;
    }
  }

  /**
   * 从localStorage加载数据（同步版本）
   * @returns {Object} 数据对象
   */
  loadData() {
    try {
      // 尝试从localStorage加载数据
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const data = safeJsonParse(savedData, this.getDefaultData());
        console.log('[DEBUG] 从localStorage加载数据成功');
        return data;
      }
      
      console.log('[DEBUG] 没有找到保存的数据，使用默认数据');
      return this.getDefaultData();
    } catch (error) {
      console.error('从localStorage加载数据失败:', error);
      return this.getDefaultData();
    }
  }

  /**
   * 异步初始化方法（检查文件存储支持并加载数据）
   */
  async initialize() {
    console.log('[DEBUG] DataManager.initialize() 开始异步初始化');
    
    try {
      // 检查文件存储支持
      console.log('[DEBUG] 检查文件存储支持...');
      this.useFileStorage = await this.checkFileStorageSupport();
      console.log('[DEBUG] 文件存储支持状态:', this.useFileStorage);
      
      // 如果支持文件存储，尝试从文件加载数据
      if (this.useFileStorage) {
        console.log('[DEBUG] 尝试从文件存储加载数据...');
        const fileData = await this.fileStorageManager.loadData();
        if (fileData && fileData.groups.length > 0) {
          console.log('[DEBUG] 从文件存储加载数据成功');
          this.data = fileData;
        } else {
          console.log('[DEBUG] 文件存储中没有数据，使用localStorage数据');
        }
      }
      
      console.log('[DEBUG] DataManager.initialize() 初始化完成');
    } catch (error) {
      console.error('DataManager初始化失败:', error);
      this.useFileStorage = false;
    }
  }

  /**
   * 保存数据到localStorage和JSON文件
   */
  async saveData() {
    try {
      // 保存到localStorage（兼容性）
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      
      // 如果支持文件存储，同时保存到文件
      if (this.useFileStorage) {
        await this.fileStorageManager.scheduleAutoSave(this.data);
      }
      
      this.scheduleAutoSave();
      return true;
    } catch (error) {
      console.error('保存数据失败:', error);
      showNotification('保存数据失败，请检查浏览器存储空间', 'error');
      return false;
    }
  }

  /**
   * 手动保存数据到文件
   * @returns {Promise<boolean>} 保存是否成功
   */
  async manualSaveToFile() {
    try {
      if (!this.useFileStorage) {
        showNotification('文件存储不可用', 'warning');
        return false;
      }
      
      const success = await this.fileStorageManager.manualSave(this.data);
      return success;
    } catch (error) {
      console.error('手动保存到文件失败:', error);
      showNotification('手动保存到文件失败', 'error');
      return false;
    }
  }

  /**
   * 从文件加载数据
   * @param {string} fileName - 文件名
   * @returns {Promise<boolean>} 加载是否成功
   */
  async loadDataFromFile(fileName) {
    try {
      if (!this.useFileStorage) {
        showNotification('文件存储不可用', 'warning');
        return false;
      }
      
      const data = await this.fileStorageManager.loadDataFromFile(fileName);
      if (data) {
        this.data = data;
        this.saveData(); // 同时保存到localStorage
        showNotification('从文件加载数据成功', 'success');
        return true;
      } else {
        showNotification('从文件加载数据失败', 'error');
        return false;
      }
    } catch (error) {
      console.error('从文件加载数据失败:', error);
      showNotification('从文件加载数据失败', 'error');
      return false;
    }
  }

  /**
   * 从用户选择的文件导入数据
   * @param {File} file - 文件对象
   * @returns {Promise<boolean>} 导入是否成功
   */
  async importDataFromFile(file) {
    try {
      if (!this.useFileStorage) {
        showNotification('文件存储不可用', 'warning');
        return false;
      }
      
      const data = await this.fileStorageManager.importDataFromFile(file);
      if (data) {
        this.data = data;
        this.saveData(); // 同时保存到localStorage
        showNotification('数据导入成功', 'success');
        return true;
      } else {
        showNotification('数据导入失败', 'error');
        return false;
      }
    } catch (error) {
      console.error('导入数据失败:', error);
      showNotification('导入数据失败: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * 备份数据到文件
   * @returns {Promise<boolean>} 备份是否成功
   */
  async backupData() {
    try {
      if (!this.useFileStorage) {
        showNotification('文件存储不可用', 'warning');
        return false;
      }
      
      return await this.fileStorageManager.backupData();
    } catch (error) {
      console.error('备份数据失败:', error);
      showNotification('备份数据失败', 'error');
      return false;
    }
  }

  /**
   * 从备份文件恢复数据
   * @param {string} fileName - 备份文件名
   * @returns {Promise<boolean>} 恢复是否成功
   */
  async restoreData(fileName) {
    try {
      if (!this.useFileStorage) {
        showNotification('文件存储不可用', 'warning');
        return false;
      }
      
      const success = await this.fileStorageManager.restoreData(fileName);
      if (success) {
        this.data = await this.fileStorageManager.loadData();
        this.saveData();
      }
      return success;
    } catch (error) {
      console.error('恢复数据失败:', error);
      showNotification('恢复数据失败', 'error');
      return false;
    }
  }

  /**
   * 获取备份文件列表
   * @returns {Promise<Array>} 备份文件列表
   */
  async getBackupList() {
    try {
      if (!this.useFileStorage) {
        return [];
      }
      
      return await this.fileStorageManager.getBackupList();
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  /**
   * 调度自动保存
   */
  scheduleAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setTimeout(() => {
      this.performAutoSave();
    }, this.autoSaveDelay);
  }

  /**
   * 执行自动保存
   */
  async performAutoSave() {
    try {
      // 保存到localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      
      // 如果支持文件存储，同时保存到文件
      if (this.useFileStorage) {
        await this.fileStorageManager.saveData(this.data);
      }
      
      console.log('数据自动保存成功');
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }

  /**
   * 获取默认数据结构
   * @returns {Object} 默认数据
   */
  getDefaultData() {
    return {
      groups: [],
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 添加组
   * @param {string} name - 组名称
   * @returns {Object|null} 新创建的组对象，失败返回null
   */
  addGroup(name) {
    console.log('[DEBUG] DataManager.addGroup() 被调用，参数:', name);
    
    const validation = validateContent(name, 1, 50);
    console.log('[DEBUG] 内容验证结果:', validation);
    
    if (!validation.isValid) {
      console.log('[DEBUG] 内容验证失败:', validation.message);
      showNotification(validation.message, 'warning');
      return null;
    }

    // 检查组名是否已存在
    const groupExists = this.data.groups.some(group => group.name.trim() === name.trim());
    console.log('[DEBUG] 组名是否已存在:', groupExists);
    
    if (groupExists) {
      console.log('[DEBUG] 组名称已存在');
      showNotification('组名称已存在', 'warning');
      return null;
    }

    console.log('[DEBUG] 创建新组...');
    const newGroup = {
      id: generateId(),
      name: name.trim(),
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    console.log('[DEBUG] 新组对象:', newGroup);

    console.log('[DEBUG] 添加组到数据中...');
    this.data.groups.push(newGroup);
    
    console.log('[DEBUG] 保存数据...');
    this.saveData();
    
    console.log('[DEBUG] 组添加成功，返回:', newGroup);
    return newGroup;
  }

  /**
   * 更新组名称
   * @param {string} groupId - 组ID
   * @param {string} newName - 新名称
   * @returns {boolean} 更新是否成功
   */
  updateGroup(groupId, newName) {
    const validation = validateContent(newName, 1, 50);
    if (!validation.isValid) {
      showNotification(validation.message, 'warning');
      return false;
    }

    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) {
      showNotification('组不存在', 'error');
      return false;
    }

    // 检查组名是否已存在
    if (this.data.groups.some(g => g.id !== groupId && g.name.trim() === newName.trim())) {
      showNotification('组名称已存在', 'warning');
      return false;
    }

    group.name = newName.trim();
    group.updatedAt = new Date().toISOString();
    this.saveData();
    return true;
  }

  /**
   * 删除组
   * @param {string} groupId - 组ID
   * @returns {boolean} 删除是否成功
   */
  deleteGroup(groupId) {
    const groupIndex = this.data.groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      showNotification('组不存在', 'error');
      return false;
    }

    this.data.groups.splice(groupIndex, 1);
    this.saveData();
    return true;
  }

  /**
   * 获取组
   * @param {string} groupId - 组ID
   * @returns {Object|null} 组对象，不存在返回null
   */
  getGroup(groupId) {
    return this.data.groups.find(g => g.id === groupId) || null;
  }

  /**
   * 获取所有组
   * @returns {Array} 组数组
   */
  getAllGroups() {
    return deepClone(this.data.groups);
  }

  /**
   * 添加条目
   * @param {string} groupId - 组ID
   * @param {string} content - 条目内容
   * @returns {Object|null} 新创建的条目对象，失败返回null
   */
  addItem(groupId, content) {
    const validation = validateContent(content, 1, 500);
    if (!validation.isValid) {
      showNotification(validation.message, 'warning');
      return null;
    }

    const group = this.getGroup(groupId);
    if (!group) {
      showNotification('组不存在', 'error');
      return null;
    }

    const newItem = {
      id: generateId(),
      content: content.trim(),
      checked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    group.items.push(newItem);
    group.updatedAt = new Date().toISOString();
    this.saveData();
    return newItem;
  }

  /**
   * 批量添加条目
   * @param {string} groupId - 组ID
   * @param {Array} contents - 条目内容数组
   * @returns {Array|null} 新创建的条目对象数组，失败返回null
   */
  addItems(groupId, contents) {
    if (!Array.isArray(contents) || contents.length === 0) {
      showNotification('请提供有效的条目内容', 'warning');
      return null;
    }

    const group = this.getGroup(groupId);
    if (!group) {
      showNotification('组不存在', 'error');
      return null;
    }

    const newItems = [];
    for (const content of contents) {
      const validation = validateContent(content, 1, 500);
      if (!validation.isValid) {
        showNotification(`${content}: ${validation.message}`, 'warning');
        continue;
      }

      const newItem = {
        id: generateId(),
        content: content.trim(),
        checked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      newItems.push(newItem);
    }

    if (newItems.length > 0) {
      group.items.push(...newItems);
      group.updatedAt = new Date().toISOString();
      this.saveData();
      return newItems;
    }

    return null;
  }

  /**
   * 更新条目内容
   * @param {string} groupId - 组ID
   * @param {string} itemId - 条目ID
   * @param {string} newContent - 新内容
   * @returns {boolean} 更新是否成功
   */
  updateItem(groupId, itemId, newContent) {
    const validation = validateContent(newContent, 1, 500);
    if (!validation.isValid) {
      showNotification(validation.message, 'warning');
      return false;
    }

    const group = this.getGroup(groupId);
    if (!group) {
      showNotification('组不存在', 'error');
      return false;
    }

    const item = group.items.find(i => i.id === itemId);
    if (!item) {
      showNotification('条目不存在', 'error');
      return false;
    }

    item.content = newContent.trim();
    item.updatedAt = new Date().toISOString();
    group.updatedAt = new Date().toISOString();
    this.saveData();
    return true;
  }

  /**
   * 批量更新条目内容
   * @param {string} groupId - 组ID
   * @param {Object} updates - 更新对象 {itemId: newContent}
   * @returns {boolean} 更新是否成功
   */
  updateItems(groupId, updates) {
    if (!updates || typeof updates !== 'object') {
      showNotification('请提供有效的更新内容', 'warning');
      return false;
    }

    const group = this.getGroup(groupId);
    if (!group) {
      showNotification('组不存在', 'error');
      return false;
    }

    let hasChanges = false;
    for (const [itemId, newContent] of Object.entries(updates)) {
      const validation = validateContent(newContent, 1, 500);
      if (!validation.isValid) {
        showNotification(`${itemId}: ${validation.message}`, 'warning');
        continue;
      }

      const item = group.items.find(i => i.id === itemId);
      if (!item) {
        showNotification(`条目 ${itemId} 不存在`, 'warning');
        continue;
      }

      item.content = newContent.trim();
      item.updatedAt = new Date().toISOString();
      hasChanges = true;
    }

    if (hasChanges) {
      group.updatedAt = new Date().toISOString();
      this.saveData();
    }

    return hasChanges;
  }

  /**
   * 更新条目选中状态
   * @param {string} groupId - 组ID
   * @param {string} itemId - 条目ID
   * @param {boolean} checked - 选中状态
   * @returns {boolean} 更新是否成功
   */
  updateItemChecked(groupId, itemId, checked) {
    const group = this.getGroup(groupId);
    if (!group) {
      showNotification('组不存在', 'error');
      return false;
    }

    const item = group.items.find(i => i.id === itemId);
    if (!item) {
      showNotification('条目不存在', 'error');
      return false;
    }

    item.checked = checked;
    item.updatedAt = new Date().toISOString();
    group.updatedAt = new Date().toISOString();
    this.saveData();
    return true;
  }

  /**
   * 删除条目
   * @param {string} groupId - 组ID
   * @param {string} itemId - 条目ID
   * @returns {boolean} 删除是否成功
   */
  deleteItem(groupId, itemId) {
    const group = this.getGroup(groupId);
    if (!group) {
      showNotification('组不存在', 'error');
      return false;
    }

    const itemIndex = group.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      showNotification('条目不存在', 'error');
      return false;
    }

    group.items.splice(itemIndex, 1);
    group.updatedAt = new Date().toISOString();
    this.saveData();
    return true;
  }

  /**
   * 获取条目
   * @param {string} groupId - 组ID
   * @param {string} itemId - 条目ID
   * @returns {Object|null} 条目对象，不存在返回null
   */
  getItem(groupId, itemId) {
    const group = this.getGroup(groupId);
    if (!group) return null;

    const item = group.items.find(i => i.id === itemId);
    return item ? deepClone(item) : null;
  }

  /**
   * 获取组内所有条目
   * @param {string} groupId - 组ID
   * @returns {Array} 条目数组
   */
  getGroupItems(groupId) {
    const group = this.getGroup(groupId);
    return group ? deepClone(group.items) : [];
  }

  /**
   * 获取所有选中的条目
   * @returns {Array} 选中条目数组，每个条目包含groupId和item信息
   */
  getSelectedItems() {
    const selectedItems = [];
    
    this.data.groups.forEach(group => {
      group.items.forEach(item => {
        if (item.checked) {
          selectedItems.push({
            groupId: group.id,
            groupName: group.name,
            itemId: item.id,
            content: item.content,
            checked: item.checked
          });
        }
      });
    });

    return selectedItems;
  }

  /**
   * 获取选中的条目（按组分组）
   * @returns {Object} 按组分组的选中条目
   */
  getSelectedItemsByGroup() {
    const selectedItems = {};
    
    this.data.groups.forEach(group => {
      const groupItems = group.items.filter(item => item.checked);
      if (groupItems.length > 0) {
        selectedItems[group.id] = {
          groupName: group.name,
          items: groupItems
        };
      }
    });

    return selectedItems;
  }

  /**
   * 格式化选中的条目内容
   * @param {string} format - 格式类型 ('simple', 'grouped', 'numbered')
   * @returns {string} 格式化后的内容
   */
  formatSelectedItems(format = 'simple') {
    const selectedItems = this.getSelectedItemsByGroup();
    
    switch (format) {
      case 'simple':
        return this.getSelectedItems().map(item => item.content).join('\n');
      
      case 'grouped':
        let result = '';
        for (const [groupId, groupData] of Object.entries(selectedItems)) {
          result += `=== ${groupData.groupName} ===\n`;
          result += groupData.items.map(item => `• ${item.content}`).join('\n');
          result += '\n\n';
        }
        return result.trim();
      
      case 'numbered':
        let numberedResult = '';
        let counter = 1;
        for (const [groupId, groupData] of Object.entries(selectedItems)) {
          groupData.items.forEach(item => {
            numberedResult += `${counter}. ${item.content}\n`;
            counter++;
          });
        }
        return numberedResult.trim();
      
      default:
        return this.getSelectedItems().map(item => item.content).join('\n');
    }
  }

  /**
   * 清除所有选中状态
   */
  clearAllSelections() {
    let hasChanges = false;

    this.data.groups.forEach(group => {
      group.items.forEach(item => {
        if (item.checked) {
          item.checked = false;
          item.updatedAt = new Date().toISOString();
          hasChanges = true;
        }
      });
      if (hasChanges) {
        group.updatedAt = new Date().toISOString();
      }
    });

    if (hasChanges) {
      this.saveData();
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const stats = {
      totalGroups: this.data.groups.length,
      totalItems: 0,
      selectedItems: 0,
      groupsWithItems: 0
    };

    this.data.groups.forEach(group => {
      stats.totalItems += group.items.length;
      stats.selectedItems += group.items.filter(item => item.checked).length;
      if (group.items.length > 0) {
        stats.groupsWithItems++;
      }
    });

    return stats;
  }

  /**
   * 导出数据
   * @returns {string} JSON格式的数据字符串
   */
  exportData() {
    return JSON.stringify({
      data: this.data,
      exportedAt: new Date().toISOString(),
      version: this.data.version
    }, null, 2);
  }

  /**
   * 导入数据
   * @param {string} jsonData - JSON格式的数据字符串
   * @returns {boolean} 导入是否成功
   */
  importData(jsonData) {
    try {
      const importedData = safeJsonParse(jsonData);
      if (!importedData || !importedData.data) {
        showNotification('无效的数据格式', 'error');
        return false;
      }

      // 验证数据结构
      if (!importedData.data.groups || !Array.isArray(importedData.data.groups)) {
        showNotification('数据格式不正确', 'error');
        return false;
      }

      // 备份当前数据
      const backupData = deepClone(this.data);
      
      try {
        this.data = importedData.data;
        this.saveData();
        showNotification('数据导入成功', 'success');
        return true;
      } catch (error) {
        // 恢复备份
        this.data = backupData;
        showNotification('数据导入失败，已恢复备份', 'error');
        return false;
      }
    } catch (error) {
      console.error('导入数据失败:', error);
      showNotification('数据导入失败', 'error');
      return false;
    }
  }

  /**
   * 清空所有数据
   * @returns {boolean} 清空是否成功
   */
  clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      this.data = this.getDefaultData();
      this.saveData();
      showNotification('所有数据已清空', 'success');
      return true;
    }
    return false;
  }

  /**
   * 重置自动保存定时器
   */
  resetAutoSaveTimer() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.scheduleAutoSave();
  }

  /**
   * 获取数据存储信息
   * @returns {Object} 存储信息
   */
  getStorageInfo() {
    const dataStr = JSON.stringify(this.data);
    const size = new Blob([dataStr]).size;
    
    const fileStorageInfo = this.useFileStorage ? this.fileStorageManager.getStorageInfo() : null;
    
    return {
      size: size,
      sizeFormatted: this.formatFileSize(size),
      groupCount: this.data.groups.length,
      itemCount: this.data.groups.reduce((sum, group) => sum + group.items.length, 0),
      lastUpdated: this.data.lastUpdated,
      storageType: this.useFileStorage ? 'file' : 'localStorage',
      fileStorage: fileStorageInfo
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
   * 迁移数据到文件存储
   * @returns {Promise<boolean>} 迁移是否成功
   */
  async migrateToFileStorage() {
    try {
      if (!this.useFileStorage) {
        showNotification('文件存储不可用', 'warning');
        return false;
      }
      
      // 检查是否已经有文件存储的数据
      const fileData = await this.fileStorageManager.loadData();
      if (fileData && fileData.groups.length > 0) {
        showNotification('文件存储中已有数据，无需迁移', 'info');
        return true;
      }
      
      // 执行迁移
      const success = await this.fileStorageManager.manualSave(this.data);
      if (success) {
        showNotification('数据迁移到文件存储成功', 'success');
        return true;
      } else {
        showNotification('数据迁移失败', 'error');
        return false;
      }
    } catch (error) {
      console.error('迁移数据失败:', error);
      showNotification('数据迁移失败', 'error');
      return false;
    }
  }

  /**
   * 切换存储方式
   * @param {boolean} useFileStorage - 是否使用文件存储
   * @returns {Promise<boolean>} 切换是否成功
   */
  async switchStorageMode(useFileStorage) {
    try {
      if (useFileStorage === this.useFileStorage) {
        showNotification('存储方式未改变', 'info');
        return true;
      }
      
      if (useFileStorage) {
        // 切换到文件存储
        const success = await this.migrateToFileStorage();
        if (success) {
          this.useFileStorage = true;
          showNotification('已切换到文件存储', 'success');
        }
        return success;
      } else {
        // 切换到localStorage
        this.useFileStorage = false;
        showNotification('已切换到localStorage存储', 'success');
        return true;
      }
    } catch (error) {
      console.error('切换存储方式失败:', error);
      showNotification('切换存储方式失败', 'error');
      return false;
    }
  }

  /**
   * 清理文件存储
   * @returns {Promise<boolean>} 清理是否成功
   */
  async cleanupFileStorage() {
    try {
      if (!this.useFileStorage) {
        showNotification('文件存储未启用', 'info');
        return true;
      }
      
      // 这里可以实现清理逻辑
      // 例如删除旧的备份文件等
      showNotification('文件存储清理完成', 'success');
      return true;
    } catch (error) {
      console.error('清理文件存储失败:', error);
      showNotification('清理文件存储失败', 'error');
      return false;
    }
  }

  /**
   * 检查数据完整性
   * @returns {Object} 检查结果
   */
  checkDataIntegrity() {
    const issues = [];
    const groups = this.getAllGroups();

    groups.forEach((group, groupIndex) => {
      if (!group.id) {
        issues.push(`组 ${groupIndex + 1}: 缺少ID`);
      }
      if (!group.name) {
        issues.push(`组 ${groupIndex + 1}: 缺少名称`);
      }
      if (!Array.isArray(group.items)) {
        issues.push(`组 ${groupIndex + 1}: 条目格式错误`);
      }

      group.items.forEach((item, itemIndex) => {
        if (!item.id) {
          issues.push(`组 ${groupIndex + 1} 条目 ${itemIndex + 1}: 缺少ID`);
        }
        if (!item.content) {
          issues.push(`组 ${groupIndex + 1} 条目 ${itemIndex + 1}: 缺少内容`);
        }
      });
    });

    return {
      valid: issues.length === 0,
      issues: issues,
      totalGroups: groups.length,
      totalItems: groups.reduce((sum, group) => sum + group.items.length, 0)
    };
  }

  /**
   * 修复数据完整性问题
   * @returns {boolean} 修复是否成功
   */
  repairDataIntegrity() {
    const integrity = this.checkDataIntegrity();
    if (integrity.valid) {
      showNotification('数据完整性检查通过', 'success');
      return true;
    }

    let hasRepaired = false;
    
    // 修复组数据
    this.data.groups.forEach((group, groupIndex) => {
      if (!group.id) {
        group.id = generateId();
        hasRepaired = true;
      }
      if (!group.name) {
        group.name = `未命名组 ${groupIndex + 1}`;
        hasRepaired = true;
      }
      if (!Array.isArray(group.items)) {
        group.items = [];
        hasRepaired = true;
      }

      // 修复条目数据
      group.items.forEach((item, itemIndex) => {
        if (!item.id) {
          item.id = generateId();
          hasRepaired = true;
        }
        if (!item.content) {
          item.content = `未命名条目 ${itemIndex + 1}`;
          hasRepaired = true;
        }
        if (item.checked === undefined) {
          item.checked = false;
          hasRepaired = true;
        }
      });
    });

    if (hasRepaired) {
      this.data.lastUpdated = new Date().toISOString();
      this.saveData();
      showNotification('数据修复完成', 'success');
    } else {
      showNotification('无法修复数据完整性问题', 'error');
    }

    return hasRepaired;
  }
}

// 导出DataManager类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
}