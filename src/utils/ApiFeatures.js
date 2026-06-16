/**
 * Chainable query builder for search / filter / sort / paginate.
 * Usage: new ApiFeatures(Book.find(), req.query).search().filter().sort().paginate()
 */
export default class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
    this.pagination = {};
  }

  search() {
    const { keyword } = this.queryStr;
    if (keyword) {
      this.query = this.query.find({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { author: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ],
      });
    }
    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };
    ['keyword', 'page', 'limit', 'sort', 'fields'].forEach((k) => delete queryCopy[k]);

    // Support gte/gt/lte/lt operators for price & rating
    let str = JSON.stringify(queryCopy);
    str = str.replace(/\b(gte|gt|lte|lt)\b/g, (m) => `$${m}`);
    this.query = this.query.find(JSON.parse(str));
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      this.query = this.query.sort(this.queryStr.sort.split(',').join(' '));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  paginate(defaultLimit = 12) {
    const page = Math.max(1, Number(this.queryStr.page) || 1);
    const limit = Math.max(1, Number(this.queryStr.limit) || defaultLimit);
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }
}
