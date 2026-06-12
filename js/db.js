// db.js
// 依赖 idb 库，在 HTML 里通过 <script src="...idb.js"> 引入

const DB_NAME = 'FamilyMenuDB';
const DB_VERSION = 1;

let dbPromise;

function openDB() {
  if (!dbPromise) {
    dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 菜品表
        if (!db.objectStoreNames.contains('dishes')) {
          const dishStore = db.createObjectStore('dishes', { keyPath: 'id' });
          dishStore.createIndex('category', 'category');
        }
        // 订单表
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('orderTime', 'orderTime');
        }
        // 设置表（简单键值对）
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ===== 菜品操作 =====
async function getAllDishes() {
  const db = await openDB();
  return db.getAll('dishes');
}

async function getDishById(id) {
  const db = await openDB();
  return db.get('dishes', id);
}

async function addDish(dish) {
  const db = await openDB();
  // dish 必须包含 id (自生成), name, category, imageData (base64), ingredients, nutrition, notes, isAvailable, createdAt
  await db.add('dishes', dish);
}

async function updateDish(dish) {
  const db = await openDB();
  await db.put('dishes', dish);
}

async function deleteDish(id) {
  const db = await openDB();
  await db.delete('dishes', id);
}

// ===== 订单操作 =====
async function getAllOrders() {
  const db = await openDB();
  return db.getAll('orders');
}

async function addOrder(order) {
  const db = await openDB();
  await db.add('orders', order);
}

// ===== 设置操作 =====
async function getSetting(key) {
  const db = await openDB();
  return db.get('settings', key);
}

async function saveSetting(key, value) {
  const db = await openDB();
  await db.put('settings', { key, value });
}