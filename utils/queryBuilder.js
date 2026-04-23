const buildMongoQuery = (params) => {
  const query = {};

  if (params.country_ids) {
    query.country_id = { $in: params.country_ids };
  } else if (params.country_id) {
    query.country_id = params.country_id.toUpperCase();
  }

  if (params.gender) {
    query.gender = params.gender;
  }

  if (params.age_group) {
    query.age_group = params.age_group;
  }

  if (params.min_age || params.max_age) {
    query.age = {};
    if (params.min_age) query.age.$gte = params.min_age;
    if (params.max_age) query.age.$lte = params.max_age;
  }

  return query;
};
module.exports = buildMongoQuery;
