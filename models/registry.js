// 模型登記表:圖號 → 定義檔位置(相對於本檔)。開頁時只載入這份清單,不載入任何模型定義;
// 讀者切到某張插圖的模型時,才以 loadModel() 載入那一張的定義。
// 新增模型:寫一份定義檔,再在這裡登記一行。
export const sources = {
  1: "./fig001.js",
  2: "./fig002.js",
  3: "./fig003.js",
  4: "./fig004.js",
  5: "./fig005.js",
  6: "./fig006.js",
  7: "./fig007.js",
  8: "./fig008.js",
  9: "./fig009.js",
  10: "./fig010.js",
  11: "./fig011.js",
  12: "./fig012.js",
  13: "./fig013.js",
  14: "./fig014.js",
  15: "./fig015.js",
  16: "./fig016.js",
  17: "./fig017.js",
  18: "./fig018.js",
  19: "./fig019.js",
  20: "./fig020.js",
  21: "./fig021.js",
  22: "./fig022.js",
  23: "./fig023.js",
  24: "./fig024.js",
  25: "./fig025.js",
  26: "./fig026.js",
  27: "./fig027.js",
  28: "./fig028.js",
  29: "./fig029.js",
  30: "./fig030.js",
  31: "./fig031.js",
  32: "./fig032.js",
  33: "./fig033.js",
  34: "./fig034.js",
  35: "./fig035.js",
  36: "./fig036.js",
  37: "./fig037.js",
  38: "./fig038.js",
  39: "./fig039.js",
  40: "./fig040.js",
  41: "./fig041.js",
  42: "./fig042.js",
  43: "./fig043.js",
  44: "./fig044.js",
  45: "./fig045.js",
  46: "./fig046.js",
  47: "./fig047.js",
  48: "./fig048.js",
  49: "./fig049.js",
  50: "./fig050.js",
  51: "./fig051.js",
  52: "./fig052.js",
  53: "./fig053.js",
  54: "./fig054.js",
  55: "./fig055.js",
  56: "./fig056.js",
  57: "./fig057.js",
  58: "./fig058.js",
  59: "./fig059.js",
  60: "./fig060.js",
  61: "./fig061.js",
  62: "./fig062.js",
  63: "./fig063.js",
  64: "./fig064.js",
  65: "./fig065.js",
  66: "./fig066.js",
  67: "./fig067.js",
  68: "./fig068.js",
  69: "./fig069.js",
  70: "./fig070.js",
  71: "./fig071.js",
  74: "./fig074.js",
  75: "./fig075.js",
  76: "./fig076.js",
  92: "./fig092.js",
  96: "./fig096.js",
  152: "./fig152.js",
  227: "./fig227.js",
  228: "./fig228.js",
  229: "./fig229.js",
  233: "./fig233.js",
  240: "./fig240.js",
  430: "./fig430.js",
  500: "./fig500.js",
};

/** 這張插圖有沒有模型(只查清單,不載入定義) */
export const hasModel = (figure) => Object.hasOwn(sources, figure);

const loading = new Map();

/** 載入一張插圖的模型定義;失敗時清掉快取,下次切換可重試 */
export function loadModel(figure) {
  if (!hasModel(figure)) return Promise.reject(new Error(`圖 ${figure} 沒有模型`));
  if (!loading.has(figure)) {
    const promise = import(sources[figure]).then(
      (m) => m.default,
      (err) => {
        loading.delete(figure);
        throw err;
      },
    );
    loading.set(figure, promise);
  }
  return loading.get(figure);
}
