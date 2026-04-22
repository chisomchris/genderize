// const buildMongoQuery = (params) => {
//   const query = {};
//   if (params.gender) query.gender = params.gender;
//   if (params.age_group) query.age_group = params.age_group;
//   if (params.country_id) query.country_id = params.country_id.toUpperCase();

//   if (params.min_age || params.max_age) {
//     query.age = {};
//     if (params.min_age) query.age.$gte = parseInt(params.min_age);
//     if (params.max_age) query.age.$lte = parseInt(params.max_age);
//   }

//   if (params.min_gender_probability)
//     query.gender_probability = {
//       $gte: parseFloat(params.min_gender_probability),
//     };
//   if (params.min_country_probability)
//     query.country_probability = {
//       $gte: parseFloat(params.min_country_probability),
//     };

//   return query;
// };

const buildMongoQuery = (params) => {
  const query = {};

  // Handle multiple countries from NLQ
  if (params.country_ids) {
    query.country_id = { $in: params.country_ids };
  } else if (params.country_id) {
    query.country_id = params.country_id.toUpperCase();
  }

  // Handle genders (now handles strings or {$in: []})
  if (params.gender) {
    query.gender = params.gender;
  }

  // Handle age groups (now handles strings or {$in: []})
  if (params.age_group) {
    query.age_group = params.age_group;
  }

  // Numeric age logic remains the same
  if (params.min_age || params.max_age) {
    query.age = {};
    if (params.min_age) query.age.$gte = params.min_age;
    if (params.max_age) query.age.$lte = params.max_age;
  }

  return query;
};
module.exports = buildMongoQuery;
