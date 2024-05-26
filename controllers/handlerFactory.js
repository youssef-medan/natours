const AppError = require('./../Utils/appError');
const APIfeatures = require('./../Utils/apIfeatures');

exports.deleteOne = (model) => async (req, res, next) => {
  try {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AddError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
};
exports.updataOne = (model) => async (req, res, next) => {
  try {
    id = req.params.id;
    const doc = await model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) return next(new AppError('No document found', 404));

    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createOne = (model) => async (req, res, next) => {
  try {
    const doc = await model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  } catch (err) {
    next(err);
  }
};
exports.getOne = (model, populateOption) => async (req, res, next) => {
  try {
    let query = model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption);
    const doc = await query;
    if (!doc) return next(new Error('No document found', 404));
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.getAll = (model) => async (req, res, next) => {
  try {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIfeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();
    const docs = await features.query;

    res.status(200).json({
      requestedAt: req.requestTime,
      status: 'success',
      results: docs.length,
      data: {
        docs,
      },
    });
  } catch (error) {
    next(error);
  }
};
