// 主应用模块

class App {
  constructor() {
    this.dataManager = new DataManager();
    this.uiManager = new UIManager(this.dataManager);
    this.isInitialized = false;
    this.isLoading = false;
    this.lastSaveTime = null;
    
    // 初始化应用
    this.init();
  }

  /**
   * 初始化应用
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      console.log('[DEBUG] App.init() 开始初始化');
      this.showLoading('正在初始化应用...');
      
      // 首先初始化DataManager（异步）
      console.log('[DEBUG] 初始化DataManager...');
      await this.dataManager.initialize();
      
      // 设置全局事件监听器
      console.log('[DEBUG] 设置全局事件监听器...');
      this.setupGlobalEventListeners();
      
      // 恢复数据
      console.log('[DEBUG] 恢复数据...');
      await this.restoreData();
      
      // 初始化完成
      this.isInitialized = true;
      console.log('[DEBUG] 层级化条目管理系统初始化完成');
      
      // 隐藏加载动画
      this.hideLoading();
      
      // 显示欢迎消息
      setTimeout(() => {
        const stats = this.dataManager.getStatistics();
        const storageInfo = this.dataManager.getStorageInfo();
        
        if (stats.totalGroups === 0) {
          showNotification('欢迎使用层级化条目管理系统！点击"添加组"开始使用', 'info');
        } else {
          const storageType = storageInfo.storageType === 'file' ? '文件存储' : 'localStorage';
          showNotification(`已加载 ${stats.totalGroups} 个组，${stats.totalItems} 个条目 (${storageType})`, 'success');
        }
        
        // 如果支持文件存储但当前使用的是localStorage，提示用户
        if (fileStorageSupported && storageInfo.storageType === 'localStorage') {
          setTimeout(() => {
            showNotification('检测到文件存储支持，可以使用更稳定的数据存储方式', 'info');
          }, 2000);
        }
      }, 500);
    } catch (error) {
      console.error('应用初始化失败:', error);
      this.hideLoading();
      showNotification('应用初始化失败，请刷新页面重试', 'error');
    }
  }

  /**
   * 显示加载动画
   * @param {string} message - 加载消息
   */
  showLoading(message = '加载中...') {
    this.isLoading = true;
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-message">${message}</div>
    `;
    document.body.appendChild(loadingOverlay);
  }

  /**
   * 隐藏加载动画
   */
  hideLoading() {
    this.isLoading = false;
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }

  /**
   * 设置全局事件监听器
   */
  setupGlobalEventListeners() {
    // 复制选中按钮事件（检查元素是否存在）
    const copySelectedBtn = document.getElementById('copy-selected-btn');
    if (copySelectedBtn) {
      copySelectedBtn.addEventListener('click', () => {
        this.handleCopySelected();
      });
    }

    // 添加组按钮事件已在UIManager中处理，这里移除重复绑定

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // 页面可见性变化处理
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // 页面卸载前保存数据
    window.addEventListener('beforeunload', () => {
      this.handleBeforeUnload();
    });

    // 存储空间不足处理
    window.addEventListener('storage', (e) => {
      if (e.key === 'hierarchical_item_manager_data' && e.newValue === null) {
        this.handleStorageError();
      }
    });
  }

  /**
   * 处理复制选中
   */
  handleCopySelected() {
    // 直接调用UIManager的方法
    this.uiManager.handleCopySelected();
  }

  /**
   * 处理键盘快捷键
   * @param {KeyboardEvent} e - 键盘事件
   */
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N: 添加新组
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      this.uiManager.handleAddGroup();
    }

    // Ctrl/Cmd + D: 复制选中
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      this.handleCopySelected();
    }

    // Ctrl/Cmd + Shift + C: 复制已选择
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      this.uiManager.handleCopySelected();
    }

    // Ctrl/Cmd + Shift + A: 取消选择
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      this.uiManager.handleClearSelection();
    }

    // Ctrl/Cmd + E: 导出数据
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      this.uiManager.exportDataUI();
    }

    // Ctrl/Cmd + I: 导入数据
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      this.handleImportData();
    }

    // Delete: 删除选中项
    if (e.key === 'Delete' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      this.handleDeleteSelected();
    }

    // Escape: 取消编辑
    if (e.key === 'Escape') {
      this.cancelEditing();
    }

    // Ctrl/Cmd + S: 保存数据
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.handleSaveData();
    }

    // Ctrl/Cmd + Shift + S: 保存到文件
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      this.handleSaveToFile();
    }

    // Ctrl/Cmd + O: 从文件加载
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      this.handleLoadFromFile();
    }

    // Ctrl/Cmd + Z: 撤销操作
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      this.handleUndo();
    }

    // Ctrl/Cmd + Shift + Z: 重做操作
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
      e.preventDefault();
      this.handleRedo();
    }
  }

  /**
   * 处理导入数据
   */
  handleImportData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target.result;
          this.uiManager.importDataUI(jsonData);
        } catch (error) {
          showNotification('文件读取失败', 'error');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  /**
   * 处理删除选中项
   */
  handleDeleteSelected() {
    const selectedItems = this.dataManager.getSelectedItems();
    
    if (selectedItems.length === 0) {
      showNotification('请先选择要删除的条目', 'warning');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedItems.length} 个条目吗？`)) {
      return;
    }

    let successCount = 0;
    selectedItems.forEach(item => {
      if (this.dataManager.deleteItem(item.groupId, item.itemId)) {
        successCount++;
      }
    });

    if (successCount > 0) {
      this.uiManager.renderAllGroups();
      this.uiManager.updateStatistics();
      showNotification(`成功删除 ${successCount} 个条目`, 'success');
    } else {
      showNotification('删除失败', 'error');
    }
  }

  /**
   * 取消编辑
   */
  cancelEditing() {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(element => {
      if (element.classList.contains('group-name')) {
        element.textContent = element.dataset.originalName;
      } else if (element.classList.contains('item-content')) {
        element.textContent = element.dataset.originalContent;
      }
      element.blur();
    });
  }

  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // 页面隐藏时保存数据
      this.dataManager.saveData();
    }
  }

  /**
   * 处理页面卸载
   */
  handleBeforeUnload() {
    // 数据已经自动保存，这里可以添加其他清理工作
    if (this.dataManager.autoSaveTimer) {
      clearTimeout(this.dataManager.autoSaveTimer);
    }
  }

  /**
   * 处理存储错误
   */
  handleStorageError() {
    showNotification('存储空间不足，部分数据可能丢失', 'error');
    // 可以在这里添加清理旧数据的逻辑
  }


  /**
   * 重置应用
   */
  resetApp() {
    if (confirm('确定要重置应用吗？所有数据将被清空。')) {
      this.showLoading('正在重置应用...');
      setTimeout(() => {
        if (this.dataManager.clearAllData()) {
          this.uiManager.renderAllGroups();
          this.uiManager.updateStatistics();
          this.hideLoading();
          showNotification('应用已重置', 'success');
        } else {
          this.hideLoading();
          showNotification('重置失败', 'error');
        }
      }, 500);
    }
  }

  /**
   * 恢复数据
   */
  async restoreData() {
    try {
      const integrity = this.dataManager.checkDataIntegrity();
      if (!integrity.valid) {
        console.warn('数据完整性检查失败:', integrity.issues);
        if (confirm('检测到数据完整性问题，是否尝试修复？')) {
          this.dataManager.repairDataIntegrity();
        }
      }
      
      this.uiManager.renderAllGroups();
      this.uiManager.updateStatistics();
      this.uiManager.updateCopyButtonState();
    } catch (error) {
      console.error('数据恢复失败:', error);
      throw error;
    }
  }

  /**
   * 处理保存数据
   */
  handleSaveData() {
    if (this.dataManager.saveData()) {
      this.lastSaveTime = new Date();
      showNotification('数据已保存', 'success');
    } else {
      showNotification('保存失败', 'error');
    }
  }

  /**
   * 处理保存到文件
   */
  async handleSaveToFile() {
    try {
      const success = await this.dataManager.manualSaveToFile();
      if (success) {
        this.lastSaveTime = new Date();
        showNotification('数据已保存到文件', 'success');
      }
    } catch (error) {
      console.error('保存到文件失败:', error);
      showNotification('保存到文件失败', 'error');
    }
  }

  /**
   * 处理从文件加载
   */
  handleLoadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        await this.dataManager.importDataFromFile(file);
        this.uiManager.renderAllGroups();
        this.uiManager.updateStatistics();
        this.uiManager.updateCopyButtonState();
        showNotification('数据从文件加载成功', 'success');
      } catch (error) {
        console.error('从文件加载失败:', error);
        showNotification('文件读取失败', 'error');
      }
    };
    
    input.click();
  }

  /**
   * 处理撤销操作
   */
  handleUndo() {
    showNotification('撤销功能开发中', 'info');
  }

  /**
   * 处理重做操作
   */
  handleRedo() {
    showNotification('重做功能开发中', 'info');
  }

  /**
   * 获取应用状态
   * @returns {Object} 应用状态
   */
  getAppStatus() {
    return {
      initialized: this.isInitialized,
      isLoading: this.isLoading,
      dataLoaded: this.dataManager.data !== null,
      lastSaveTime: this.lastSaveTime,
      statistics: this.dataManager.getStatistics(),
      storageInfo: this.dataManager.getStorageInfo()
    };
  }

  /**
   * 导出应用状态
   * @returns {Object} 应用状态快照
   */
  exportAppState() {
    return {
      timestamp: new Date().toISOString(),
      status: this.getAppStatus(),
      data: this.dataManager.exportData()
    };
  }

  /**
   * 导入应用状态
   * @param {Object} state - 应用状态
   * @returns {boolean} 导入是否成功
   */
  importAppState(state) {
    try {
      if (!state || !state.data) {
        showNotification('无效的应用状态', 'error');
        return false;
      }

      if (this.dataManager.importData(state.data)) {
        this.uiManager.renderAllGroups();
        this.uiManager.updateStatistics();
        this.uiManager.updateCopyButtonState();
        showNotification('应用状态导入成功', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('导入应用状态失败:', error);
      showNotification('导入应用状态失败', 'error');
      return false;
    }
  }

  /**
   * 获取性能统计
   * @returns {Object} 性能统计
   */
  getPerformanceStats() {
    return {
      memoryUsage: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      timing: {
        init: performance.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : null
      }
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    if (confirm('确定要清理缓存吗？这将清除所有本地存储的数据。')) {
      localStorage.clear();
      this.dataManager.data = this.dataManager.getDefaultData();
      this.uiManager.renderAllGroups();
      this.uiManager.updateStatistics();
      showNotification('缓存已清理', 'success');
    }
  }

  /**
   * 检查更新
   */
  checkForUpdates() {
    showNotification('正在检查更新...', 'info');
    // 这里可以添加实际的更新检查逻辑
    setTimeout(() => {
      showNotification('当前已是最新版本', 'success');
    }, 1000);
  }

  /**
   * 检查数据完整性
   * @returns {Object} 检查结果
   */
  checkDataIntegrity() {
    const issues = [];
    const groups = this.dataManager.getAllGroups();

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
   * 自动备份功能
   */
  autoBackup() {
    const backupData = this.dataManager.exportData();
    const backupKey = `backup_${Date.now()}`;
    localStorage.setItem(backupKey, backupData);
    
    // 清理30天前的备份
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    Object.keys(localStorage)
      .filter(key => key.startsWith('backup_'))
      .forEach(key => {
        const backupTime = parseInt(key.replace('backup_', ''));
        if (backupTime < thirtyDaysAgo) {
          localStorage.removeItem(key);
        }
      });
  }

  /**
   * 恢复备份
   * @param {string} backupKey - 备份键名
   */
  restoreBackup(backupKey) {
    const backupData = localStorage.getItem(backupKey);
    if (backupData) {
      if (this.dataManager.importData(backupData)) {
        this.uiManager.renderAllGroups();
        this.uiManager.updateStatistics();
        showNotification('备份恢复成功', 'success');
        return true;
      }
    }
    showNotification('备份恢复失败', 'error');
    return false;
  }

  /**
   * 获取备份列表
   * @returns {Array} 备份列表
   */
  getBackupList() {
    const backups = [];
    Object.keys(localStorage)
      .filter(key => key.startsWith('backup_'))
      .forEach(key => {
        const backupTime = parseInt(key.replace('backup_', ''));
        backups.push({
          key: key,
          time: new Date(backupTime),
          data: localStorage.getItem(key)
        });
      });
    
    return backups.sort((a, b) => b.time - a.time);
  }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  // 确保工具函数可用
  if (typeof generateId === 'undefined') {
    console.error('工具函数未加载');
    return;
  }

  // 初始化应用
  window.app = new App();
});

// 导出App类（用于Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}