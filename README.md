QDB
===

_This project is no longer maintained and part of my source code "attic". Do not use this repository without fully understanding the code._

Promise utilities for Sequelize models.

Usage
-----

Define a model in sequelize and create a `Qdb` instance for the model.

```javascript
var Sequelize = require('sequelize');
var Qdb = require('q-db');

var sequelize = new Sequelize('somethingsomethingmysql');

var user = sequelize.define('user', {
    id       : { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name     : { type: Sequelize.STRING },
    password : { type: Sequelize.STRING }
});

var quser = new Qdb(sequelize, user);
```

Then you can use it and it'll return promises for just about anything.

```javascript
// create a user with the given properties
var promise = quser.create({ name: 'philipp', password: 'notplaintextplease' });
```

```javascript
// update password where name = 'philipp'
var promise = quser.update({ password: 'wait' }, { name: 'philipp' });
```

With everything being properties and promises it gets really when you combine it with a framework like Connect, Express. Especially when you have extra middleware that handles promises:

```javascript
// Adds the `.promise` method to every response object, so promises can be returned
app.use(function (req, res, next) {
    res.promise = function (promise) {
        promise
            .then(function (result) {
                res.json(200, result);
            })
            .fail(function (err) {
                logger.warn(err);
                res.json(err.httpcode || 500, err.message);
            });
    };
    next();
});
```

Assuming you'd want to return all properties of a model, you'd be able to do something like this:

```javascript
app.get('/api/todo/:id', function (req, res) {
    res.promise(qtodo.read(req.params));
});
```
