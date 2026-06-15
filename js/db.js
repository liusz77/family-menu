// db.js  使用腾讯云 CloudBase 文档型数据库
// 注意：需要在全局环境有 app (cloudbase实例) 和 db (数据库实例)
// 已在 index.html 中初始化并注入

// ===== 菜品操作 =====
async function getAllDishes() {
  const res = await db.collection('Dish')
    .orderBy('createTime', 'desc')
    .get();
  // 映射 _id 为 id，方便前端使用
  return res.data.map(dish => ({
    id: dish._id,
    name: dish.name,
    category: dish.category,
    imageData: dish.imageData,
    ingredients: dish.ingredients,
    nutrition: dish.nutrition,
    notes: dish.notes,
    isAvailable: dish.isAvailable,
    createTime: dish.createTime
  }));
}

async function getDishById(id) {
  const res = await db.collection('Dish').doc(id).get();
  const dish = res.data[0];
  return {
    id: dish._id,
    name: dish.name,
    category: dish.category,
    imageData: dish.imageData,
    ingredients: dish.ingredients,
    nutrition: dish.nutrition,
    notes: dish.notes,
    isAvailable: dish.isAvailable,
    createTime: dish.createTime
  };
}

async function addDish(dishData) {
  // 移除前端生成的 id，让数据库自动生成 _id
  const { id, ...data } = dishData;
  await db.collection('Dish').add(data);
}

async function updateDish(dishData) {
  const { id, ...data } = dishData;
  await db.collection('Dish').doc(id).update(data);
}

async function deleteDish(id) {
  await db.collection('Dish').doc(id).remove();
}

// ===== 订单操作 =====
async function getAllOrders() {
  const res = await db.collection('Order')
    .orderBy('orderTime', 'desc')
    .get();
  return res.data.map(order => ({
    id: order._id,
    dishName: order.dishName,
    quantity: order.quantity,
    notes: order.notes,
    status: order.status,
    orderTime: order.orderTime
  }));
}

async function addOrder(orderData) {
  // 同样移除可能传入的 id，使用数据库自动生成的
  const { id, ...data } = orderData;
  await db.collection('Order').add(data);
}

// ===== 设置操作 =====
async function getSetting(key) {
  const res = await db.collection('Setting')
    .where({ key: key })
    .get();
  if (res.data.length > 0) {
    return res.data[0]; // 返回 { key, value }
  }
  return null;
}

async function saveSetting(key, value) {
  // 先查找是否存在
  const exist = await db.collection('Setting').where({ key }).get();
  if (exist.data.length > 0) {
    // 更新
    await db.collection('Setting').doc(exist.data[0]._id).update({ value });
  } else {
    // 新增
    await db.collection('Setting').add({ key, value });
  }
}
