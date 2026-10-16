// 截圖服務的排隊:服務一次只畫一頁;每個還在等的呼叫各一條隊伍,輪流從下一條拿一頁(像發牌)。
// 上限與輪流都以「頁」為單位。呼叫是 { pages: [還沒畫的頁…] },take() 會從它的 pages 取走一頁。
export class Queue {
  #calls = [];
  #turn = 0;

  add(call) {
    this.#calls.push(call);
  }

  remove(call) {
    const i = this.#calls.indexOf(call);
    if (i < 0) return;
    this.#calls.splice(i, 1);
    if (i < this.#turn) this.#turn--;
  }

  take() {
    if (!this.#calls.length) return undefined;
    const i = this.#turn % this.#calls.length;
    const call = this.#calls[i];
    const page = call.pages.shift();
    if (call.pages.length) this.#turn = i + 1;
    else {
      this.#calls.splice(i, 1);
      this.#turn = i;
    }
    return { call, page };
  }

  // 照輪流的順序,這個呼叫的最後一頁之前會先畫幾頁別人的(它的頁都已取走時是 0)
  ahead(call) {
    if (!this.#calls.includes(call)) return 0;
    const left = this.#calls.map((c) => c.pages.length);
    let turn = this.#turn;
    let count = 0;
    while (left.some((n) => n > 0)) {
      const i = turn % left.length;
      if (left[i] === 0) {
        turn = i + 1;
        continue;
      }
      left[i]--;
      if (this.#calls[i] === call) {
        if (left[i] === 0) return count;
      } else count++;
      turn = i + 1;
    }
    return count;
  }
}
