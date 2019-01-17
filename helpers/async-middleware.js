const asyncMiddleware = (f) => (req, res, next) => {
  Promise.resolve(f(req, res, next))
    .catch(next);
};
module.exports = asyncMiddleware;