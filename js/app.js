// app.js
// 全局变量
let currentPage = 'menu';
let dishes = [];
let cart = []; // { dishId, name, quantity, notes }
let editingDishId = null;

// ===== 页面导航 =====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const page = e.currentTarget.dataset.page;
    switchPage(page);
  });
});

function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-page="${page}"]`).classList.add('active');
  currentPage = page;
  if (page === 'menu') renderMenu();
  if (page === 'cart') renderCart();
  if (page === 'orders') renderOrders();
  if (page === 'manage') renderManage();
  if (page === 'settings') loadSettings();
}

// ===== 菜单页 =====
async function renderMenu() {
  dishes = await getAllDishes();
  const grid = document.getElementById('dish-grid');
  grid.innerHTML = '';
  const selectedCat = document.querySelector('.cat-btn.active')?.dataset.cat || '全部';
  
  let filtered = dishes;
  if (selectedCat !== '全部') filtered = dishes.filter(d => d.category === selectedCat);
  
  filtered.forEach(dish => {
    const card = document.createElement('div');
    card.className = `dish-card ${dish.isAvailable ? '' : 'unavailable'}`;
    card.innerHTML = `
      <img src="${dish.imageData || 'icons/icon-192.png'}" alt="${dish.name}">
      <div class="info">
        <div class="name">${dish.name}</div>
        <div class="status ${dish.isAvailable ? 'supply' : 'nosupply'}">${dish.isAvailable ? '供应中' : '缺货'}</div>
      </div>
    `;
    card.addEventListener('click', () => showDetail(dish));
    grid.appendChild(card);
  });

  // 随机惊喜
  const surpriseToggle = await getSetting('randomSurprise');
  if (surpriseToggle?.value) {
    const available = filtered.filter(d => d.isAvailable);
    if (available.length > 0) {
      const random = available[Math.floor(Math.random() * available.length)];
      const bar = document.getElementById('surprise-bar');
      bar.classList.remove('hidden');
      bar.innerHTML = `🎉 要不要试试「${random.name}」？ <button class="btn-orange" style="padding:4px 12px;">去看看</button>`;
      bar.querySelector('button').onclick = () => showDetail(random);
    } else {
      document.getElementById('surprise-bar').classList.add('hidden');
    }
  } else {
    document.getElementById('surprise-bar').classList.add('hidden');
  }
}

// 分类切换
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    renderMenu();
  });
});

// 详情弹窗
function showDetail(dish) {
  const modal = document.getElementById('detail-modal');
  document.getElementById('detail-img').src = dish.imageData || 'icons/icon-192.png';
  document.getElementById('detail-name').textContent = dish.name;
  document.getElementById('detail-ingredients').textContent = dish.ingredients || '';
  document.getElementById('detail-nutrition').textContent = dish.nutrition || '';
  document.getElementById('detail-notes').textContent = dish.notes || '';
  document.getElementById('qty-num').textContent = '1';
  document.getElementById('order-note').value = '';
  modal.classList.remove('hidden');

  // 数量增减
  let qty = 1;
  document.getElementById('qty-minus').onclick = () => {
    if (qty > 1) { qty--; document.getElementById('qty-num').textContent = qty; }
  };
  document.getElementById('qty-plus').onclick = () => {
    if (qty < 10) { qty++; document.getElementById('qty-num').textContent = qty; }
  };
  document.getElementById('add-to-cart').onclick = () => {
    cart.push({
      dishId: dish.id,
      name: dish.name,
      quantity: qty,
      notes: document.getElementById('order-note').value
    });
    modal.classList.add('hidden');
    alert('已加入购物车');
  };
}
document.querySelector('#detail-modal .close').onclick = () => {
  document.getElementById('detail-modal').classList.add('hidden');
};

// ===== 购物车 =====
function renderCart() {
  const list = document.getElementById('cart-list');
  const emptyHint = document.getElementById('cart-empty');
  list.innerHTML = '';
  if (cart.length === 0) {
    emptyHint.classList.remove('hidden');
    document.getElementById('submit-order').classList.add('hidden');
  } else {
    emptyHint.classList.add('hidden');
    document.getElementById('submit-order').classList.remove('hidden');
    cart.forEach((item, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div><strong>${item.name}</strong> x${item.quantity}</div>
        <div class="note">${item.notes || ''}</div>
        <button data-index="${index}" class="remove-item btn-orange" style="padding:4px 8px;">删除</button>
      `;
      list.appendChild(li);
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.onclick = (e) => {
        const idx = e.target.dataset.index;
        cart.splice(idx, 1);
        renderCart();
      };
    });
  }
}
document.getElementById('submit-order').addEventListener('click', async () => {
  if (cart.length === 0) return;
  for (let item of cart) {
    await addOrder({
      id: Date.now().toString() + Math.random(),
      dishName: item.name,
      quantity: item.quantity,
      notes: item.notes,
      status: 'pending',
      orderTime: new Date().toISOString()
    });
  }
  cart = [];
  renderCart();
  alert('订单已提交！');
});

// ===== 订单页 =====
async function renderOrders() {
  const orders = await getAllOrders();
  const list = document.getElementById('order-list');
  list.innerHTML = '';
  if (orders.length === 0) list.innerHTML = '<div class="empty-hint">暂无订单</div>';
  orders.sort((a,b) => (a.orderTime > b.orderTime ? -1 : 1));
  orders.forEach(order => {
    const li = document.createElement('li');
    const time = new Date(order.orderTime).toLocaleString();
    li.innerHTML = `
      <div><strong>${order.dishName}</strong> x${order.quantity}</div>
      <div>备注: ${order.notes || '-'}</div>
      <div>时间: ${time}</div>
      <div>状态: ${order.status}</div>
    `;
    list.appendChild(li);
  });
  document.querySelector('.order-count').textContent = `共 ${orders.length} 单`;
}

// ===== 管理页 =====
async function renderManage() {
  const dishes = await getAllDishes();
  const list = document.getElementById('manage-list');
  list.innerHTML = '';
  dishes.forEach(dish => {
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${dish.imageData || 'icons/icon-192.png'}" width="40" height="40" style="object-fit:cover;border-radius:6px;">
      <span>${dish.name} (${dish.category})</span>
      <button class="edit-dish btn-orange" data-id="${dish.id}">编辑</button>
      <button class="delete-dish btn-orange" data-id="${dish.id}">删除</button>
      <label>供应 <input type="checkbox" class="avail-toggle" data-id="${dish.id}" ${dish.isAvailable ? 'checked' : ''}></label>
    `;
    list.appendChild(li);
  });
  // 绑定事件
  document.querySelectorAll('.edit-dish').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.target.dataset.id;
      const dish = await getDishById(id);
      openDishForm(dish);
    };
  });
  document.querySelectorAll('.delete-dish').forEach(btn => {
    btn.onclick = async (e) => {
      if (confirm('确定删除？')) {
        await deleteDish(e.target.dataset.id);
        renderManage();
        renderMenu();
      }
    };
  });
  document.querySelectorAll('.avail-toggle').forEach(cb => {
    cb.onchange = async (e) => {
      const id = e.target.dataset.id;
      const dish = await getDishById(id);
      dish.isAvailable = e.target.checked;
      await updateDish(dish);
      if (currentPage === 'menu') renderMenu();
    };
  });
}

document.getElementById('add-dish-btn').onclick = () => openDishForm(null);
function openDishForm(dish) {
  const modal = document.getElementById('dish-form-modal');
  modal.classList.remove('hidden');
  document.getElementById('form-title').textContent = dish ? '编辑菜品' : '添加菜品';
  document.getElementById('dish-name').value = dish?.name || '';
  document.getElementById('dish-category').value = dish?.category || '菜';
  document.getElementById('dish-ingredients').value = dish?.ingredients || '';
  document.getElementById('dish-nutrition').value = dish?.nutrition || '';
  document.getElementById('dish-notes').value = dish?.notes || '';
  document.getElementById('dish-available').checked = dish ? dish.isAvailable : true;
  const preview = document.getElementById('dish-preview');
  if (dish?.imageData) {
    preview.src = dish.imageData;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
  editingDishId = dish?.id || null;
}
document.querySelector('.close-form').onclick = () => {
  document.getElementById('dish-form-modal').classList.add('hidden');
};
document.getElementById('dish-image').addEventListener('change', function() {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('dish-preview');
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
});
document.getElementById('save-dish').addEventListener('click', async () => {
  const name = document.getElementById('dish-name').value.trim();
  if (!name) { alert('请输入名称'); return; }
  const dishData = {
    name,
    category: document.getElementById('dish-category').value,
    imageData: document.getElementById('dish-preview').src || '',
    ingredients: document.getElementById('dish-ingredients').value,
    nutrition: document.getElementById('dish-nutrition').value,
    notes: document.getElementById('dish-notes').value,
    isAvailable: document.getElementById('dish-available').checked,
    createdAt: new Date().toISOString(),
  };
  if (editingDishId) {
    dishData.id = editingDishId;
    await updateDish(dishData);
  } else {
    dishData.id = Date.now().toString() + Math.random();
    await addDish(dishData);
  }
  document.getElementById('dish-form-modal').classList.add('hidden');
  renderManage();
  renderMenu();
});

// ===== 设置页 =====
async function loadSettings() {
  const surprise = await getSetting('randomSurprise');
  document.getElementById('surprise-toggle').checked = surprise?.value || false;
}
document.getElementById('surprise-toggle').addEventListener('change', async (e) => {
  await saveSetting('randomSurprise', e.target.checked);
  if (currentPage === 'menu') renderMenu();
});

// ===== 初始化 =====
(async () => {
  // 首次启动填入一些示例菜品（可选）
  const existing = await getAllDishes();
  if (existing.length === 0) {
    await addDish({
      id: '1', name: '番茄炒蛋', category: '菜', imageData: '',
      ingredients: '番茄、鸡蛋', nutrition: '热量120kcal', notes: '含鸡蛋', isAvailable: true, createdAt: new Date().toISOString()
    });
    await addDish({
      id: '2', name: '橙汁', category: '饮品', imageData: '',
      ingredients: '橙子', nutrition: '糖分15g', notes: '鲜榨', isAvailable: true, createdAt: new Date().toISOString()
    });
  }
  switchPage('menu');
})();