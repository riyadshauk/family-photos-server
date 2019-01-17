/**
 * @todo test this functionality
 */

class ListNode {
  constructor(data) {
    this.next = null;
    this.data = data;
  }
}

class Queue {
  constructor() {
    this.count = 0;
    this.head = this.tail = null;
  }
  push(item) {
    if (!this.head) {
      this.head = new ListNode(item);
      this.tail = this.head;
    } else {
      this.tail.next = new ListNode(item);
      this.tail = this.tail.next;
    }
    this.count++;
  }
  pop() {
    if (!this.head) return;
    const item = this.head.data;
    this.head = this.head.next;
    this.count--;
    if (!this.head) this.tail = null;
    return item;
  }
}

/**
 * motivation: keeping images in memory when lazy-loading sequentially down a page
 * -> use case: retrieving EXIF data in separate API call after retrieving image.
 * 
 * Ultimately, it would be nice to have this kind of cache distributed on some other node (NoSQL territory, I suppose),
 * but that's not needed right now just for hosting family photos.
 */
class FIFOCache {
  constructor(limit) {
    this.limit = limit;
    this.history = new Queue();
    this.cache = {};
  }
  insert(key, val) {
    this.cache[key] = val;
    this.history.push(key);
    if (this.history.count > this.limit) {
      delete this.cache[this.history.pop()];
    }
  }
  /**
   * @param {string} key 
   * @return {undefined | any} val
   */
  get(key) {
    return this.cache[key];
  }
}

module.exports = { FIFOCache };