var Q = require('q');

/**
 * @param sequelize a configured Sequelize instance.
 * @param model a Sequelize defined model.
 */
var qdb = function (sequelize, model) {
    this.sequelize = sequelize;
    this.model = model;
};

/**
 * returns a result object containing all properties on the given object that are also defined as columns on the
 * model. this is useful when creating an object for filtering on with a Sequelize#find operation, as we don't want to
 * be filtering on properties that do not exist.
 *
 * @param object any object.
 */
qdb.prototype._filterProperties = function (object) {
    if(object == null){
        return {};
    }
    var filtered = {};
    for (var i in this.model.rawAttributes) {
        if (this.model.rawAttributes.hasOwnProperty(i) && object.hasOwnProperty(i)) {
            filtered[i] = object[i];
        }
    }
    return filtered;
};

/**
 * given a Sequelize result set, this returns the array of all dataValues within the set.
 *
 * @param items
 * @returns {Array}
 * @private
 */
qdb._filterDataValues = function (items) {
    var result = [];
    items.forEach(function(item){
        result.push(item.dataValues);
    });
    return result;
};

/**
 * Queries on the model, using given where as the parameter to model#findAll
 *
 * @param where
 * @return {Promise}
 */
qdb.prototype.read = function (where) {

    var deferred = Q.defer();

    var filtered = this._filterProperties(where);
    this.model.findAll({ where: filtered })
        .success(function (items) {
            var result = qdb._filterDataValues(items);
            deferred.resolve(result);
        }).error(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;

};

/**
 * Performs a given query.
 *
 * @param query
 * @param where
 * @returns {Promise}
 */
qdb.prototype.query = function (query, where) {

    var deferred = Q.defer();

    this.sequelize.query(query, this.model, {raw: true}, where)
        .success(function (result) {
            if (Array.isArray(result)) {
                deferred.resolve(result);
            }
            else {
                deferred.resolve();
            }
        }).error(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;

};


/**
 * Deletes objects where given where parameters equal.
 *
 * @param where
 * @returns {Promise}
 */
qdb.prototype.delete = function (where) {

    var deferred = Q.defer();
    var self = this;

    var properties = self._filterProperties(where);
    self.model.findAll({ where: properties })
        .success(function (items) {
            var result = qdb._filterDataValues(items);
            // TODO: convert so that this cannot delete different objects than we return.
            self.model.destroy(properties)
                .success(function () {
                    deferred.resolve(result);
                }).error(function (error) {
                    deferred.reject(error);
                });
        }).error(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;

};

/**
 * Saves an given object as a model.
 *
 * @param object
 * @return {Promise}
 */
qdb.prototype.create = function (object) {

    var deferred = Q.defer();

    var properties = this._filterProperties(object);
    this.model.build(properties).save({ where: properties })
        .success(function (item) {
            var result = item.dataValues;
            deferred.resolve(result);
        }).error(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;

};

/**
 * Updates all entries on the model where the given where matches with the new object properties.
 *
 * @param object
 * @param where
 * @return {Promise}
 */
qdb.prototype.update = function (object, where) {

    var deferred = Q.defer();

    var criteria = this._filterProperties(where);
    var properties = this._filterProperties(object);
    this.model.update(properties, criteria)
        .success(function () {
            deferred.resolve({});
        }).error(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;

};

module.exports = qdb;
