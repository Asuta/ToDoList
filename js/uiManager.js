// UI管理模块

class UIManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.groupsContainer = document.getElementById('groups-container');
    this.addGroupBtn = document.getElementById('add-group-btn');
    this.copySelectedBtn = document.getElementById('copy-selected-btn');
    this.clearSelectionBtn = document.getElementById('clear-selection-btn');
    
    // 拖拽相关状态
    this.draggedElement = null;
    this.draggedType = null;
    this.draggedId = null;
    this.draggedIndex = null;
    this.placeholderElement = null;
    
    // 编辑相关状态
    this.editingElement = null;
    this.editingTimeout = null;
    
    // 文件存储相关状态
    this.fileStorageSupported = false;
    
    // 初始化
    this.init();
  }

  /**
   * 初始化UI
   */
  async init() {
    console.log('[DEBUG] UIManager.init() 开始初始化');
    
    // 获取文件存储支持状态（从DataManager）
    this.fileStorageSupported = this.dataManager.useFileStorage;
    console.log('[DEBUG] 文件存储支持:', this.fileStorageSupported);
    
    console.log('[DEBUG] 渲染所有组...');
    this.renderAllGroups();
    
    console.log('[DEBUG] 设置事件监听器...');
    this.setupEventListeners();
    
    console.log('[DEBUG] 更新统计信息...');
    this.updateStatistics();
    
    console.log('[DEBUG] 更新按钮状态...');
    this.updateCopyButtonState();
    
    // 如果支持文件存储，添加文件存储相关按钮
    if (this.fileStorageSupported) {
      console.log('[DEBUG] 添加文件存储相关按钮...');
      this.addFileStorageButtons();
    }
    
    console.log('[DEBUG] UIManager.init() 初始化完成');
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    console.log('[DEBUG] setupEventListeners() 开始设置事件监听器');
    
    // 检查DOM元素是否存在
    console.log('[DEBUG] 添加组按钮元素:', this.addGroupBtn);
    console.log('[DEBUG] 复制选中按钮元素:', this.copySelectedBtn);
    console.log('[DEBUG] 组容器元素:', this.groupsContainer);
    
    // 添加组按钮
    if (this.addGroupBtn) {
      console.log('[DEBUG] 绑定添加组按钮点击事件');
      this.addGroupBtn.addEventListener('click', () => {
        console.log('[DEBUG] 添加组按钮被点击');
        this.handleAddGroup();
      });
    } else {
      console.error('[DEBUG] 添加组按钮元素不存在!');
    }

    // 复制选中按钮
    if (this.copySelectedBtn) {
      console.log('[DEBUG] 绑定复制选中按钮点击事件');
      this.copySelectedBtn.addEventListener('click', () => this.handleCopySelected());
    } else {
      console.error('[DEBUG] 复制选中按钮元素不存在!');
    }

    // 取消选择按钮
    if (this.clearSelectionBtn) {
      console.log('[DEBUG] 绑定取消选择按钮点击事件');
      this.clearSelectionBtn.addEventListener('click', () => this.handleClearSelection());
    } else {
      console.error('[DEBUG] 取消选择按钮元素不存在!');
    }

    // 使用事件委托处理动态元素
    if (this.groupsContainer) {
      console.log('[DEBUG] 绑定组容器事件委托');
      this.groupsContainer.addEventListener('click', (e) => this.handleGroupContainerClick(e));
      this.groupsContainer.addEventListener('change', (e) => this.handleGroupContainerChange(e));
      this.groupsContainer.addEventListener('keydown', (e) => this.handleGroupContainerKeydown(e));
      this.groupsContainer.addEventListener('blur', (e) => this.handleGroupContainerBlur(e), true);
      
      // 拖拽事件
      this.groupsContainer.addEventListener('dragstart', (e) => this.handleDragStart(e));
      this.groupsContainer.addEventListener('dragover', (e) => this.handleDragOver(e));
      this.groupsContainer.addEventListener('drop', (e) => this.handleDrop(e));
      this.groupsContainer.addEventListener('dragend', (e) => this.handleDragEnd(e));
      this.groupsContainer.addEventListener('dragenter', (e) => this.handleDragEnter(e));
      this.groupsContainer.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    } else {
      console.error('[DEBUG] 组容器元素不存在!');
    }

    // 窗口大小变化时重新检查视口
    window.addEventListener('resize', debounce(() => this.checkViewportVisibility(), 200));
    
    console.log('[DEBUG] setupEventListeners() 事件监听器设置完成');
  }

  /**
   * 处理组容器点击事件
   * @param {Event} e - 点击事件
   */
  handleGroupContainerClick(e) {
    const target = e.target;
    
    // 添加条目按钮
    if (target.classList.contains('add-item-btn')) {
      const groupId = target.closest('.group-card').dataset.groupId;
      this.handleAddItem(groupId);
      return;
    }

    // 删除组按钮
    if (target.classList.contains('delete-group-btn')) {
      const groupId = target.closest('.group-card').dataset.groupId;
      this.handleDeleteGroup(groupId);
      return;
    }

    // 删除条目按钮
    if (target.classList.contains('delete-item-btn')) {
      const itemCard = target.closest('.item-card');
      const groupId = itemCard.closest('.group-card').dataset.groupId;
      const itemId = itemCard.dataset.itemId;
      this.handleDeleteItem(groupId, itemId);
      return;
    }
    
    // 双击编辑组名称
    if (target.classList.contains('group-name') && e.detail === 2) {
      this.startEditingGroup(target);
      return;
    }
    
    // 双击编辑条目内容
    if (target.classList.contains('item-content') && e.detail === 2) {
      this.startEditingItem(target);
      return;
    }
  }

  /**
   * 处理组容器变化事件
   * @param {Event} e - 变化事件
   */
  handleGroupContainerChange(e) {
    const target = e.target;
    
    // 条目复选框
    if (target.classList.contains('item-checkbox')) {
      const itemCard = target.closest('.item-card');
      const groupId = itemCard.closest('.group-card').dataset.groupId;
      const itemId = itemCard.dataset.itemId;
      const checked = target.checked;
      
      this.dataManager.updateItemChecked(groupId, itemId, checked);
      this.updateItemSelection(itemCard, checked);
      this.updateCopyButtonState();
      return;
    }
  }

  /**
   * 处理组容器键盘事件
   * @param {Event} e - 键盘事件
   */
  handleGroupContainerKeydown(e) {
    const target = e.target;
    
    // 组名称编辑
    if (target.classList.contains('group-name')) {
      if (e.key === 'Enter') {
        e.preventDefault();
        target.blur();
      }
      return;
    }

    // 条目内容编辑
    if (target.classList.contains('item-content')) {
      if (e.key === 'Enter') {
        e.preventDefault();
        target.blur();
      }
      return;
    }
  }

  /**
   * 处理组容器失焦事件
   * @param {Event} e - 失焦事件
   */
  handleGroupContainerBlur(e) {
    const target = e.target;
    
    // 组名称编辑完成
    if (target.classList.contains('group-name')) {
      this.finishEditingGroup(target);
      return;
    }

    // 条目内容编辑完成
    if (target.classList.contains('item-content')) {
      this.finishEditingItem(target);
      return;
    }
  }

  /**
   * 渲染所有组
   */
  renderAllGroups() {
    this.groupsContainer.innerHTML = '';
    
    const groups = this.dataManager.getAllGroups();
    if (groups.length === 0) {
      this.renderEmptyState();
      return;
    }

    groups.forEach(group => {
      this.renderGroup(group);
    });

    // 检查视口可见性
    setTimeout(() => this.checkViewportVisibility(), 100);
  }

  /**
   * 渲染单个组
   * @param {Object} group - 组对象
   */
  renderGroup(group) {
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';
    groupCard.dataset.groupId = group.id;
    
    groupCard.innerHTML = `
      <div class="group-header">
        <h2 class="group-name" data-original-name="${group.name}" draggable="true">${group.name}</h2>
        <div class="group-actions">
          <button class="btn-icon add-item-btn" title="添加条目">+</button>
          <button class="btn-icon delete-group-btn" title="删除组">×</button>
        </div>
      </div>
      <div class="group-items">
        ${group.items.map(item => this.renderItem(item, group.id)).join('')}
      </div>
    `;

    this.groupsContainer.appendChild(groupCard);
  }

  /**
   * 渲染单个条目
   * @param {Object} item - 条目对象
   * @param {string} groupId - 组ID
   * @returns {string} 条目HTML字符串
   */
  renderItem(item, groupId) {
    return `
      <div class="item-card ${item.checked ? 'selected' : ''}" data-item-id="${item.id}" draggable="true">
        <input type="checkbox" class="item-checkbox" ${item.checked ? 'checked' : ''}>
        <div class="item-content" data-original-content="${item.content}">${item.content}</div>
        <button class="btn-icon delete-item-btn" title="删除条目">×</button>
      </div>
    `;
  }

  /**
   * 渲染空状态
   */
  renderEmptyState() {
    this.groupsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">还没有任何组</div>
        <div class="empty-state-subtext">点击"添加组"按钮开始创建您的第一个组</div>
      </div>
    `;
  }

  /**
   * 处理添加组
   */
  handleAddGroup() {
    console.log('[DEBUG] handleAddGroup() 方法被调用');
    
    const groupName = prompt('请输入组名称：');
    console.log('[DEBUG] 用户输入的组名称:', groupName);
    
    if (!groupName) {
      console.log('[DEBUG] 用户取消了组名称输入');
      return;
    }

    console.log('[DEBUG] 调用 dataManager.addGroup()...');
    const newGroup = this.dataManager.addGroup(groupName);
    console.log('[DEBUG] dataManager.addGroup() 返回:', newGroup);
    
    if (newGroup) {
      console.log('[DEBUG] 渲染新组...');
      this.renderGroup(newGroup);
      this.updateStatistics();
      showNotification('组添加成功', 'success');
      this.highlightNewElement(document.querySelector(`[data-group-id="${newGroup.id}"]`));
      console.log('[DEBUG] 组添加成功');
    } else {
      console.log('[DEBUG] 组添加失败');
    }
  }

  /**
   * 处理添加条目
   * @param {string} groupId - 组ID
   */
  handleAddItem(groupId) {
    const itemContent = prompt('请输入条目内容：');
    if (!itemContent) return;

    const newItem = this.dataManager.addItem(groupId, itemContent);
    if (newItem) {
      const groupCard = document.querySelector(`[data-group-id="${groupId}"]`);
      const groupItems = groupCard.querySelector('.group-items');
      
      const newItemElement = document.createElement('div');
      newItemElement.innerHTML = this.renderItem(newItem, groupId);
      const itemCard = newItemElement.firstElementChild;
      
      groupItems.appendChild(itemCard);
      this.updateStatistics();
      showNotification('条目添加成功', 'success');
      this.highlightNewElement(itemCard);
    }
  }

  /**
   * 处理删除组
   * @param {string} groupId - 组ID
   */
  handleDeleteGroup(groupId) {
    if (!confirm('确定要删除这个组吗？组内所有条目也将被删除。')) return;

    if (this.dataManager.deleteGroup(groupId)) {
      const groupCard = document.querySelector(`[data-group-id="${groupId}"]`);
      groupCard.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        groupCard.remove();
        this.updateStatistics();
        this.checkEmptyState();
      }, 300);
      showNotification('组删除成功', 'success');
    }
  }

  /**
   * 处理删除条目
   * @param {string} groupId - 组ID
   * @param {string} itemId - 条目ID
   */
  handleDeleteItem(groupId, itemId) {
    if (!confirm('确定要删除这个条目吗？')) return;

    if (this.dataManager.deleteItem(groupId, itemId)) {
      const itemCard = document.querySelector(`[data-group-id="${groupId}"] [data-item-id="${itemId}"]`);
      itemCard.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        itemCard.remove();
        this.updateStatistics();
      }, 300);
      showNotification('条目删除成功', 'success');
    }
  }

  /**
   * 处理复制选中
   */
  handleCopySelected() {
    const selectedItems = this.dataManager.getSelectedItems();
    
    if (selectedItems.length === 0) {
      showNotification('请先选择要复制的条目', 'warning');
      return;
    }

    // 显示格式选择对话框
    this.showCopyFormatDialog(selectedItems);
  }

  /**
   * 显示复制格式选择对话框
   * @param {Array} selectedItems - 选中的条目
   */
  showCopyFormatDialog(selectedItems) {
    const formats = [
      { value: 'simple', label: '简单格式', description: '每行一个条目' },
      { value: 'grouped', label: '分组格式', description: '按组分组显示' },
      { value: 'numbered', label: '编号格式', description: '带编号的列表' }
    ];

    const formatHtml = formats.map(format => `
      <div class="format-option" data-value="${format.value}">
        <div class="format-label">${format.label}</div>
        <div class="format-description">${format.description}</div>
      </div>
    `).join('');

    const dialog = document.createElement('div');
    dialog.className = 'copy-format-dialog';
    dialog.innerHTML = `
      <div class="dialog-overlay"></div>
      <div class="dialog-content">
        <h3>选择复制格式</h3>
        <div class="format-options">
          ${formatHtml}
        </div>
        <div class="dialog-actions">
          <button class="btn btn-secondary" onclick="this.closest('.copy-format-dialog').remove()">取消</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // 添加点击事件
    dialog.querySelectorAll('.format-option').forEach(option => {
      option.addEventListener('click', () => {
        const format = option.dataset.value;
        this.performCopy(selectedItems, format);
        dialog.remove();
      });
    });

    // 点击遮罩关闭
    dialog.querySelector('.dialog-overlay').addEventListener('click', () => {
      dialog.remove();
    });
  }

  /**
   * 执行复制操作
   * @param {Array} selectedItems - 选中的条目
   * @param {string} format - 复制格式
   */
  performCopy(selectedItems, format = 'simple') {
    let content;
    
    switch (format) {
      case 'simple':
        content = selectedItems.map(item => item.content).join('\n');
        break;
      case 'grouped':
        content = this.dataManager.formatSelectedItems('grouped');
        break;
      case 'numbered':
        content = this.dataManager.formatSelectedItems('numbered');
        break;
      default:
        content = selectedItems.map(item => item.content).join('\n');
    }

    copyToClipboard(content)
      .then(() => {
        showNotification(`已复制 ${selectedItems.length} 个条目内容到剪贴板`, 'success');
      })
      .catch(() => {
        showNotification('复制失败，请手动复制', 'error');
      });
  }

  /**
   * 处理取消选择
   */
  handleClearSelection() {
    const selectedItems = this.dataManager.getSelectedItems();
    
    if (selectedItems.length === 0) {
      showNotification('没有选中的条目', 'warning');
      return;
    }

    if (!confirm(`确定要取消选择所有 ${selectedItems.length} 个条目吗？`)) {
      return;
    }

    // 清除所有选中状态
    this.dataManager.clearAllSelections();
    
    // 更新UI
    this.updateAllSelectionStates();
    
    // 更新按钮状态
    this.updateCopyButtonState();
    
    // 显示成功消息
    showNotification(`已取消选择 ${selectedItems.length} 个条目`, 'success');
  }

  /**
   * 更新所有条目的选中状态
   */
  updateAllSelectionStates() {
    const selectedItems = this.dataManager.getSelectedItems();
    const selectedIds = new Set(selectedItems.map(item => `${item.groupId}-${item.itemId}`));
    
    // 更新所有条目的选中状态样式
    document.querySelectorAll('.item-card').forEach(itemCard => {
      const groupId = itemCard.closest('.group-card').dataset.groupId;
      const itemId = itemCard.dataset.itemId;
      const itemKey = `${groupId}-${itemId}`;
      
      if (selectedIds.has(itemKey)) {
        itemCard.classList.add('selected');
        const checkbox = itemCard.querySelector('.item-checkbox');
        if (checkbox) checkbox.checked = true;
      } else {
        itemCard.classList.remove('selected');
        const checkbox = itemCard.querySelector('.item-checkbox');
        if (checkbox) checkbox.checked = false;
      }
    });
  }

  /**
   * 更新选中计数显示
   * @param {number} count - 选中数量
   */
  updateSelectionCount(count) {
    // 查找或创建选中计数元素
    let countElement = document.querySelector('.selection-count');
    
    if (count === 0) {
      if (countElement) {
        countElement.remove();
      }
      return;
    }
    
    if (!countElement) {
      // 在复制按钮前插入计数元素
      if (this.copySelectedBtn) {
        countElement = document.createElement('span');
        countElement.className = 'selection-count';
        this.copySelectedBtn.parentNode.insertBefore(countElement, this.copySelectedBtn);
      }
    }
    
    if (countElement) {
      countElement.textContent = count;
    }
  }

  /**
   * 更新条目选中状态样式
   * @param {HTMLElement} itemCard - 条目卡片元素
   * @param {boolean} checked - 选中状态
   */
  updateItemSelection(itemCard, checked) {
    if (checked) {
      itemCard.classList.add('selected');
    } else {
      itemCard.classList.remove('selected');
    }
  }

  /**
   * 更新复制按钮状态
   */
  updateCopyButtonState() {
    const selectedItems = this.dataManager.getSelectedItems();
    const hasSelection = selectedItems.length > 0;
    
    // 更新复制按钮状态
    if (this.copySelectedBtn) {
      this.copySelectedBtn.disabled = !hasSelection;
      this.copySelectedBtn.style.display = hasSelection ? 'flex' : 'none';
    }
    
    // 更新取消选择按钮状态
    if (this.clearSelectionBtn) {
      this.clearSelectionBtn.disabled = !hasSelection;
      this.clearSelectionBtn.style.display = hasSelection ? 'flex' : 'none';
    }
    
    // 更新选中计数显示
    this.updateSelectionCount(selectedItems.length);
  }

  /**
   * 更新统计信息
   */
  updateStatistics() {
    const stats = this.dataManager.getStatistics();
    // 可以在这里添加统计信息显示逻辑
    console.log('统计信息:', stats);
  }

  /**
   * 检查空状态
   */
  checkEmptyState() {
    const groups = this.dataManager.getAllGroups();
    if (groups.length === 0) {
      this.renderEmptyState();
    }
  }

  /**
   * 检查视口可见性
   */
  checkViewportVisibility() {
    const groupCards = document.querySelectorAll('.group-card');
    groupCards.forEach(card => {
      if (isElementInViewport(card)) {
        card.style.opacity = '1';
      }
    });
  }

  /**
   * 高亮显示新添加的元素
   * @param {HTMLElement} element - 要高亮的元素
   */
  highlightNewElement(element) {
    element.style.animation = 'none';
    element.offsetHeight; // 触发重排
    element.style.animation = 'fadeIn 0.5s ease-out';
  }

  /**
   * 开始编辑组名称
   * @param {HTMLElement} element - 组名称元素
   */
  startEditingGroup(element) {
    if (this.editingElement) {
      this.finishEditingGroup(this.editingElement);
    }
    
    this.editingElement = element;
    element.contentEditable = true;
    element.focus();
    
    // 选中所有文本
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // 保存原始名称
    element.dataset.originalName = element.textContent;
  }

  /**
   * 完成编辑组名称
   * @param {HTMLElement} element - 组名称元素
   */
  finishEditingGroup(element) {
    if (!element || !element.contentEditable) return;
    
    const groupId = element.closest('.group-card').dataset.groupId;
    const newName = element.textContent.trim();
    
    element.contentEditable = false;
    
    if (newName && newName !== element.dataset.originalName) {
      if (this.dataManager.updateGroup(groupId, newName)) {
        showNotification('组名称更新成功', 'success');
        element.dataset.originalName = newName;
      } else {
        element.textContent = element.dataset.originalName;
        showNotification('组名称更新失败', 'error');
      }
    } else {
      element.textContent = element.dataset.originalName;
    }
    
    this.editingElement = null;
  }

  /**
   * 开始编辑条目内容
   * @param {HTMLElement} element - 条目内容元素
   */
  startEditingItem(element) {
    if (this.editingElement) {
      this.finishEditingItem(this.editingElement);
    }
    
    this.editingElement = element;
    element.contentEditable = true;
    element.focus();
    
    // 选中所有文本
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // 保存原始内容
    element.dataset.originalContent = element.textContent;
  }

  /**
   * 完成编辑条目内容
   * @param {HTMLElement} element - 条目内容元素
   */
  finishEditingItem(element) {
    if (!element || !element.contentEditable) return;
    
    const itemCard = element.closest('.item-card');
    const groupId = itemCard.closest('.group-card').dataset.groupId;
    const itemId = itemCard.dataset.itemId;
    const newContent = element.textContent.trim();
    
    element.contentEditable = false;
    
    if (newContent && newContent !== element.dataset.originalContent) {
      if (this.dataManager.updateItem(groupId, itemId, newContent)) {
        showNotification('条目内容更新成功', 'success');
        element.dataset.originalContent = newContent;
      } else {
        element.textContent = element.dataset.originalContent;
        showNotification('条目内容更新失败', 'error');
      }
    } else {
      element.textContent = element.dataset.originalContent;
    }
    
    this.editingElement = null;
  }

  /**
   * 处理拖拽开始
   * @param {Event} e - 拖拽事件
   */
  handleDragStart(e) {
    const target = e.target;
    
    // 确定拖拽类型和元素
    if (target.classList.contains('group-name')) {
      this.draggedType = 'group';
      this.draggedElement = target.closest('.group-card');
      this.draggedId = this.draggedElement.dataset.groupId;
    } else if (target.classList.contains('item-card')) {
      this.draggedType = 'item';
      this.draggedElement = target;
      this.draggedId = target.dataset.itemId;
      this.draggedIndex = Array.from(target.parentNode.children).indexOf(target);
    }
    
    if (this.draggedElement) {
      this.draggedElement.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.draggedElement.innerHTML);
    }
  }

  /**
   * 处理拖拽悬停
   * @param {Event} e - 拖拽事件
   */
  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = this.getDragAfterElement(this.groupsContainer, e.clientY);
    if (afterElement == null) {
      this.groupsContainer.appendChild(this.draggedElement);
    } else {
      this.groupsContainer.insertBefore(this.draggedElement, afterElement);
    }
    
    return false;
  }

  /**
   * 处理拖拽进入
   * @param {Event} e - 拖拽事件
   */
  handleDragEnter(e) {
    const target = e.target.closest('.group-card, .item-card');
    if (target && target !== this.draggedElement) {
      target.style.backgroundColor = '#e0f2fe';
    }
  }

  /**
   * 处理拖拽离开
   * @param {Event} e - 拖拽事件
   */
  handleDragLeave(e) {
    const target = e.target.closest('.group-card, .item-card');
    if (target) {
      target.style.backgroundColor = '';
    }
  }

  /**
   * 处理拖拽放置
   * @param {Event} e - 拖拽事件
   */
  handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    const target = e.target.closest('.group-card, .group-items');
    if (!target) return;
    
    // 重置所有元素的背景色
    document.querySelectorAll('.group-card, .item-card').forEach(el => {
      el.style.backgroundColor = '';
    });
    
    // 处理组排序
    if (this.draggedType === 'group') {
      this.handleGroupSort();
    }
    // 处理条目排序
    else if (this.draggedType === 'item') {
      this.handleItemSort(target);
    }
    
    return false;
  }

  /**
   * 处理拖拽结束
   * @param {Event} e - 拖拽事件
   */
  handleDragEnd(e) {
    // 重置所有元素的样式
    document.querySelectorAll('.group-card, .item-card').forEach(el => {
      el.style.opacity = '';
      el.style.backgroundColor = '';
    });
    
    this.draggedElement = null;
    this.draggedType = null;
    this.draggedId = null;
    this.draggedIndex = null;
    this.placeholderElement = null;
  }

  /**
   * 获取拖拽后的元素位置
   * @param {HTMLElement} container - 容器元素
   * @param {number} y - 鼠标Y坐标
   * @returns {HTMLElement} 拖拽后的元素
   */
  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.group-card:not(.dragging), .item-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  /**
   * 处理组排序
   */
  handleGroupSort() {
    const groupCards = [...this.groupsContainer.querySelectorAll('.group-card')];
    const newOrder = groupCards.map(card => card.dataset.groupId);
    
    // 重新排序数据
    const reorderedGroups = [];
    newOrder.forEach(groupId => {
      const group = this.dataManager.getGroup(groupId);
      if (group) {
        reorderedGroups.push(group);
      }
    });
    
    this.dataManager.data.groups = reorderedGroups;
    this.dataManager.saveData();
    showNotification('组排序已更新', 'success');
  }

  /**
   * 处理条目排序
   * @param {HTMLElement} target - 目标元素
   */
  handleItemSort(target) {
    const groupCard = target.closest('.group-card');
    if (!groupCard) return;
    
    const groupId = groupCard.dataset.groupId;
    const itemCards = [...groupCard.querySelectorAll('.item-card')];
    const newOrder = itemCards.map(card => card.dataset.itemId);
    
    // 重新排序数据
    const group = this.dataManager.getGroup(groupId);
    if (!group) return;
    
    const reorderedItems = [];
    newOrder.forEach(itemId => {
      const item = group.items.find(item => item.id === itemId);
      if (item) {
        reorderedItems.push(item);
      }
    });
    
    group.items = reorderedItems;
    group.updatedAt = new Date().toISOString();
    this.dataManager.saveData();
    showNotification('条目排序已更新', 'success');
  }

  /**
   * 搜索过滤功能
   * @param {string} query - 搜索查询
   */
  filterGroups(query) {
    const groupCards = document.querySelectorAll('.group-card');
    const lowerQuery = query.toLowerCase();

    groupCards.forEach(card => {
      const groupName = card.querySelector('.group-name').textContent.toLowerCase();
      const items = card.querySelectorAll('.item-content');
      let hasMatch = groupName.includes(lowerQuery);

      if (!hasMatch) {
        items.forEach(item => {
          if (item.textContent.toLowerCase().includes(lowerQuery)) {
            hasMatch = true;
          }
        });
      }

      card.style.display = hasMatch ? 'block' : 'none';
    });
  }

  /**
   * 导入数据UI
   * @param {string} jsonData - JSON数据
   */
  importDataUI(jsonData) {
    if (this.dataManager.importData(jsonData)) {
      this.renderAllGroups();
      this.updateStatistics();
      this.updateCopyButtonState();
      showNotification('数据导入成功', 'success');
    }
  }

  /**
   * 导出数据UI
   * @returns {string} JSON数据
   */
  exportDataUI() {
    const jsonData = this.dataManager.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `hierarchical_items_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('数据导出成功', 'success');
    return jsonData;
  }
  /**
   * 添加文件存储相关按钮
   */
  addFileStorageButtons() {
    const headerActions = document.querySelector('.header-actions');
    
    // 添加保存到文件按钮
    const saveToFileBtn = document.createElement('button');
    saveToFileBtn.id = 'save-to-file-btn';
    saveToFileBtn.className = 'btn btn-secondary';
    saveToFileBtn.title = '保存到文件';
    saveToFileBtn.innerHTML = '💾';
    saveToFileBtn.addEventListener('click', () => this.handleSaveToFile());
    headerActions.appendChild(saveToFileBtn);
    
    // 添加从文件加载按钮
    const loadFromFileBtn = document.createElement('button');
    loadFromFileBtn.id = 'load-from-file-btn';
    loadFromFileBtn.className = 'btn btn-secondary';
    loadFromFileBtn.title = '从文件加载';
    loadFromFileBtn.innerHTML = '📁';
    loadFromFileBtn.addEventListener('click', () => this.handleLoadFromFile());
    headerActions.appendChild(loadFromFileBtn);
    
    // 添加数据管理按钮
    const dataManagementBtn = document.createElement('button');
    dataManagementBtn.id = 'data-management-btn';
    dataManagementBtn.className = 'btn btn-secondary';
    dataManagementBtn.title = '数据管理';
    dataManagementBtn.innerHTML = '⚙️';
    dataManagementBtn.addEventListener('click', () => this.showDataManagementDialog());
    headerActions.appendChild(dataManagementBtn);
  }

  /**
   * 处理保存到文件
   */
  async handleSaveToFile() {
    try {
      const success = await this.dataManager.manualSaveToFile();
      if (success) {
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
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await this.dataManager.importDataFromFile(file);
          this.renderAllGroups();
          this.updateStatistics();
          this.updateCopyButtonState();
        } catch (error) {
          showNotification('文件读取失败', 'error');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  /**
   * 显示数据管理对话框
   */
  showDataManagementDialog() {
    const storageInfo = this.dataManager.getStorageInfo();
    
    const dialog = document.createElement('div');
    dialog.className = 'data-management-dialog';
    dialog.innerHTML = `
      <div class="dialog-overlay"></div>
      <div class="dialog-content">
        <h3>数据管理</h3>
        
        <div class="storage-info">
          <h4>存储信息</h4>
          <p>存储方式: ${storageInfo.storageType === 'file' ? '文件存储' : 'localStorage'}</p>
          <p>数据大小: ${storageInfo.sizeFormatted}</p>
          <p>组数量: ${storageInfo.groupCount}</p>
          <p>条目数量: ${storageInfo.itemCount}</p>
          <p>最后更新: ${new Date(storageInfo.lastUpdated).toLocaleString()}</p>
        </div>
        
        <div class="data-actions">
          <h4>数据操作</h4>
          <button class="btn btn-primary" onclick="uiManager.handleBackupData()">备份数据</button>
          <button class="btn btn-secondary" onclick="uiManager.handleMigrateStorage()">迁移存储</button>
          <button class="btn btn-secondary" onclick="uiManager.handleClearData()">清空数据</button>
        </div>
        
        <div class="file-actions">
          <h4>文件操作</h4>
          <button class="btn btn-secondary" onclick="uiManager.handleExportData()">导出数据</button>
          <button class="btn btn-secondary" onclick="uiManager.handleImportData()">导入数据</button>
        </div>
        
        <div class="dialog-actions">
          <button class="btn btn-secondary" onclick="this.closest('.data-management-dialog').remove()">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // 点击遮罩关闭
    dialog.querySelector('.dialog-overlay').addEventListener('click', () => {
      dialog.remove();
    });
  }

  /**
   * 处理备份数据
   */
  async handleBackupData() {
    try {
      const success = await this.dataManager.backupData();
      if (success) {
        showNotification('数据备份成功', 'success');
      }
    } catch (error) {
      console.error('备份数据失败:', error);
      showNotification('备份数据失败', 'error');
    }
  }

  /**
   * 处理迁移存储
   */
  async handleMigrateStorage() {
    try {
      const success = await this.dataManager.migrateToFileStorage();
      if (success) {
        showNotification('数据迁移成功', 'success');
      }
    } catch (error) {
      console.error('数据迁移失败:', error);
      showNotification('数据迁移失败', 'error');
    }
  }

  /**
   * 处理清空数据
   */
  handleClearData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      this.dataManager.clearAllData();
      this.renderAllGroups();
      this.updateStatistics();
      showNotification('所有数据已清空', 'success');
    }
  }

  /**
   * 处理导出数据
   */
  handleExportData() {
    const jsonData = this.dataManager.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `hierarchical_items_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('数据导出成功', 'success');
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
      reader.onload = async (e) => {
        try {
          const jsonData = e.target.result;
          this.dataManager.importData(jsonData);
          this.renderAllGroups();
          this.updateStatistics();
          showNotification('数据导入成功', 'success');
        } catch (error) {
          showNotification('数据导入失败', 'error');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  /**
   * 更新保存状态显示
   * @param {string} status - 保存状态
   */
  updateSaveStatus(status) {
    const saveStatusElement = document.getElementById('save-status');
    if (saveStatusElement) {
      saveStatusElement.textContent = status;
      saveStatusElement.className = `save-status ${status}`;
    }
  }
}

// 导出UIManager类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}