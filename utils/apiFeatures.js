class APIFEATURES {
  constructor(query, queryString, param) {
    this.query = query;
    this.queryString = queryString;
    this.param = param ? param : {}
  }

  filter() {
    // 1) filtering
    const query = { ...this.queryString };
    const excludedeStrings = ["page", "sort", "limit", "fields"];
    excludedeStrings.forEach(el => delete query[el]);

    // 2) Advanced Filtering
    const strRequest = JSON.stringify(query);
    const filteredStrRequest = strRequest.replace(
      /\b(lt|lte|gt|gte)\b/g,
      match => `$${match}`
    );
    const args = {...JSON.parse(filteredStrRequest), ...this.param}
    console.log("Args: ", args);
    this.query = this.query.find(args);

    return this;
  }

  sort() {
    // 3) Sorting
    if (this.queryString.sort) {
      // sort  by two values
      const filteredString = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(filteredString);
    } else {
      // query = query.sort("-createdAt");
    }

    return this;
  }

  fields() {
    // 4) feilds limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  pagination() {
    // 5) pagination
    if (this.queryString.page) {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1;
      const skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);
      const countDocument = this.query.countDocuments();

      if (skip + limit > countDocument) {
        throw new Error("No more content");
      }
    }
    return this;
  }

  limit() {
    if (this.queryString.limit) {
      const limit = this.queryString.limit * 1;
      this.query = this.query.limit(limit);
    }
    return this;
  }
}

module.exports = APIFEATURES;
