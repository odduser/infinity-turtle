/**
 * Module dependencies.
 */

var angular = require('angular');
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var MongoClient = require('mongodb').MongoClient;
var myDb;
var mongourl = 'mongodb://127.0.0.1:27017/odduser';


function connect(callback) {
        if (myDb === undefined) {
                MongoClient.connect(mongourl, function(err, db) {
                        if(err) return callback(err);
                        myDb = db;
                        callback(null, db);
                });
        } else {
                callback(null, myDb);
        }
}

var app = express();

var App = angular.module('drag-and-drop', ['ngDragDrop']);

App.controller('oneCtrl', function($scope, $timeout) {
  $scope.list1 = [];
  $scope.list2 = [];
  $scope.list3 = [];
  $scope.list4 = [];

  $scope.list5 = [
    { 'title': 'Item 1', 'drag': true },
    { 'title': 'Item 2', 'drag': true },
    { 'title': 'Item 3', 'drag': true },
    { 'title': 'Item 4', 'drag': true },
    { 'title': 'Item 5', 'drag': true },
    { 'title': 'Item 6', 'drag': true },
    { 'title': 'Item 7', 'drag': true },
    { 'title': 'Item 8', 'drag': true }
  ];

  // Limit items to be dropped in list1
  $scope.optionsList1 = {
    accept: function(dragEl) {
      if ($scope.list1.length >= 2) {
        return false;
      } else {
        return true;
      }
    }
  };
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

app.get('/time/:junk', function(req, res) {
    connect(function(err,db) {
        if (err) return console.error(err);
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        var today = new Date();
        today.setHours(today.getHours() - 7);
        res.write(today.toJSON());
        res.end();
    })
});

app.get('/time', function(req, res) {
    connect(function(err,db) {
        if (err) return console.error(err);
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        var today = new Date();
        today.setHours(today.getHours() - 7);
        res.write(today.toJSON());
        res.end();
    })
});

// http://flimp.com:3000/v1/findall/egg
app.get('/v3/findall/:what?', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('v3items', function(err, coll) {
                if (err) return console.error(err);
            var what = req.params.what || '';
            var expr = '.*' + what + '.*';
            console.log(expr);
            //coll.find( { raw: { $regex: expr, $options: 'i' } }).sort({path:1,slot:1}, function(err, cursor) {
            coll.find( { id: { $regex: expr, $options: 'i' } }).sort({id:1}, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "text/plain",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                    res.write(
                        "index label chest slot id dmg qty max name raw mod name2\n"
                    );
                    for (i in items) {
                        var item = items[i];
                        if (item.raw !== "empty")
                            var index = parseInt(i)+1
                            res.write(
                                index + " " +
                                item.label + " " + item.chest + " " + item.slot + " " + item.id + " " +
                                item.dmg + " " + item.qty + " " + item.max + " " + item.name + " " +
                                item.raw + " " + item.mod + " " + item.name2 + "\n"
                            );
                    };
                    res.end();
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/show/odduser.us/odduser/9/2fru
app.get('/v1/show/:host/:world/:cid/:path', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('items', function(err, coll) {
                if (err) return console.error(err);
            coll.find( { path: req.params.path } ).sort({ slot: 1 }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "text/plain",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        for (i in items) {
                            var item = items[i];
                            res.write(item.slot + " " + item.qty + "/" + item.max + " " + item.id + ":" + item.dmg + " " + item.raw + "\n");
                        };
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/recipe/item.enginestone
app.get('/v1/recipe/:what', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('recipes', function(err, coll) {
                if (err) return console.error(err);
            var what = req.params.what;
            var expr = '.*' + what + '.*';
            console.log(expr);
            coll.find( { item: { $regex: expr, $options: 'i'} }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,recipes) {
                        if (err) return console.error(err);
                    res.writeHead(200, {
                        "Content-Type": "text/plain",
                        "Access-Control-Allow-Origin": "*"
                    });
                    var recipe = recipes[0];
                    if (recipe) {
                        console.log(recipe);
                        var rec = recipe.recipe;
                        for (i in rec) {
                            res.write(i + ' ' + rec[i] + "\n");
                        }
                    }
                    res.end();
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/empty/odduser.us/odduser/9
app.get('/v1/empty/:host/:world/:cid', function(req, res) {
    connect(function(err,db) { if (err) return console.error(err);
        db.collection('items', function(err, coll) { if (err) return console.error(err);
            coll.find( { host: req.params.host,
                         world: req.params.world,
                         cid: parseInt(req.params.cid),
                         raw: 'empty'
                    } ).sort( { path: 1 }, function(err, cursor) { if (err) return console.error(err);
                cursor.toArray(function(err,items) { if (err) return console.error(err);
                    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        //var first = doc[0];
                        //console.log(doc)
                        //res.write(JSON.stringify(first));
                        var doc = items[0];
                        res.write(doc.path + " " + doc.slot);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v2/9/84
app.get('/v2/empty/:cid/:label', function(req, res) {
    connect(function(err,db) { if (err) return console.error(err);
        db.collection('items', function(err, coll) { if (err) return console.error(err);
            coll.find( { cid: parseInt(req.params.cid),
                         raw: 'empty',
                         'label': (req.params.label === 0 ? 100 : req.params.label)
                    } ).sort( { path: 1 }, function(err, cursor) { if (err) return console.error(err);
                cursor.toArray(function(err,items) { if (err) return console.error(err);
                    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        //var first = doc[0];
                        console.log(doc)
                        //res.write(JSON.stringify(first));
                        var doc = items[0];
                        res.write(doc.path + " " + doc.slot);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/countpathslot/odduser.us/odduser/:path/:slot
app.get('/v1/countpathslot/:host/:world/:cid/:path/:slot', function(req, res) {
    connect(function(err,db) { if (err) return console.error(err);
        db.collection('items', function(err, coll) { if (err) return console.error(err);
            coll.find( { host: req.params.host,
                         world: req.params.world,
                         cid: parseInt(req.params.cid),
                         path: req.params.path,
                         slot: parseInt(req.params.slot)
                    }, { qty: 1, _id: 0 }, function(err, cursor) { if (err) return console.error(err);
                cursor.toArray(function(err,items) { if (err) return console.error(err);
                    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        //var first = doc[0];
                        //res.write(JSON.stringify(first));
                        var doc = items[0];
                        console.log(doc)
                        res.write('' + doc.qty);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/countpathslot/odduser.us/odduser/:path/:slot
app.get('/v2/countpathslot/:cid/:path/:slot', function(req, res) {
    connect(function(err,db) { if (err) return console.error(err);
        db.collection('items', function(err, coll) { if (err) return console.error(err);
            coll.find( { cid: parseInt(req.params.cid),
                         path: req.params.path,
                         slot: parseInt(req.params.slot)
                    }, { qty: 1, _id: 0 }, function(err, cursor) { if (err) return console.error(err);
                cursor.toArray(function(err,items) { if (err) return console.error(err);
                    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        //var first = doc[0];
                        //res.write(JSON.stringify(first));
                        var doc = items[0];
                        console.log(doc)
                        res.write('' + doc.qty);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/dist/odduser.us/odduser/:path
app.get('/v1/dist/:host/:world/:cid/:path', function(req, res) {
    connect(function(err,db) { if (err) return console.error(err);
        db.collection('items', function(err, coll) { if (err) return console.error(err);
            coll.find( { host: req.params.host,
                         world: req.params.world,
                         cid: parseInt(req.params.cid),
                         path: req.params.path
                    }, { dist: 1, _id: 0 }, function(err, cursor) { if (err) return console.error(err);
                cursor.toArray(function(err,items) { if (err) return console.error(err);
                    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        //var first = doc[0];
                        //res.write(JSON.stringify(first));
                        var doc = items[0];
                        console.log(doc)
                        res.write('' + doc.dist);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/dist/odduser.us/odduser/:path
app.get('/v2/dist/:cid/:path', function(req, res) {
    connect(function(err,db) { if (err) return console.error(err);
        db.collection('items', function(err, coll) { if (err) return console.error(err);
            coll.find( { cid: parseInt(req.params.cid),
                         path: req.params.path
                    }, { dist: 1, _id: 0 }, function(err, cursor) { if (err) return console.error(err);
                cursor.toArray(function(err,items) { if (err) return console.error(err);
                    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        //var first = doc[0];
                        //res.write(JSON.stringify(first));
                        var doc = items[0];
                        console.log(doc)
                        res.write('' + doc.dist);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/chest/:cid/:path
app.get('/v1/chest/:cid/:path', function(req, res) {
    connect(function(err,db) { if (err) return console.error(err);
        db.collection('items', function(err, coll) { if (err) return console.error(err);
            coll.find( { cid: parseInt(req.params.cid),
                         path: req.params.path
                    }, { dist: 1, _id: 0 }, function(err, cursor) { if (err) return console.error(err);
                cursor.toArray(function(err,items) { if (err) return console.error(err);
                    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        //var first = doc[0];
                        //res.write(JSON.stringify(first));
                        var doc = items[0];
                        console.log(doc)
                        res.write('' + doc.label);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/facing/odduser.us/odduser/:path
app.get('/v1/facing/:host/:world/:cid/:path', function(req, res) {
    connect(function(err,db) { if (err) return console.error(err);
        db.collection('items', function(err, coll) { if (err) return console.error(err);
            coll.find( { host: req.params.host,
                         world: req.params.world,
                         cid: parseInt(req.params.cid),
                         path: req.params.path
                    }, { facing: 1, _id: 0 }, function(err, cursor) { if (err) return console.error(err);
                cursor.toArray(function(err,items) { if (err) return console.error(err);
                    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        //var first = doc[0];
                        //res.write(JSON.stringify(first));
                        var doc = items[0];
                        console.log(doc)
                        res.write('' + doc.facing);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/facing/odduser.us/odduser/:path
app.get('/v2/facing/:cid/:path', function(req, res) {
    connect(function(err,db) { if (err) return console.error(err);
        db.collection('items', function(err, coll) { if (err) return console.error(err);
            coll.find( { cid: parseInt(req.params.cid),
                         path: req.params.path
                    }, { facing: 1, _id: 0 }, function(err, cursor) { if (err) return console.error(err);
                cursor.toArray(function(err,items) { if (err) return console.error(err);
                    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
                    if (items.length === 0) {
                        res.write("end 0\n"); res.end();
                    } else {
                        //var first = doc[0];
                        //res.write(JSON.stringify(first));
                        var doc = items[0];
                        console.log(doc)
                        res.write('' + doc.facing);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/countiddmg/odduser.us/odduser/9/5/1 (host/world/cid/id/dmg)
app.get('/v1/countiddmg/:host/:world/:cid/:id/:dmg', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('items', function(err, coll) {
                if (err) return console.error(err);
            var id = parseInt(req.params.id);
            var dmg = (req.params.dmg ? parseInt(req.params.dmg) : 0);
            var need = (req.params.need ? parseInt(req.params.need) : 1);
            coll.find( { id:id, dmg:dmg }, { qty: 1, _id: 0 }, function(err, cursor) {

                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "text/plain",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        var total = 0
                        for (i in items) {
                            var item = items[i];
                            total = total + item.qty;
                        };
                        res.write('' + total);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/countiddmg/odduser.us/odduser/9/5/1 (host/world/cid/id/dmg)
app.get('/v2/countiddmg/:cid/:id/:dmg', function(req, res) {
    connect(function(err,db) {
        if (err) return console.error(err);
        db.collection('items', function(err, coll) {
            if (err) return console.error(err);
            var cid = parseInt(req.params.cid);
            var id = parseInt(req.params.id);
            var dmg = (req.params.dmg ? parseInt(req.params.dmg) : 0);
            coll.find( { cid: cid, id:id, dmg:dmg }, { qty: 1, _id: 0 }, function(err, cursor) {
                if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                    if (err) return console.error(err);
                    res.writeHead(200, {
                        "Content-Type": "text/plain",
                        "Access-Control-Allow-Origin": "*"
                    });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        var total = 0
                        for (i in items) {
                            var item = items[i];
                            total = total + item.qty;
                        };
                        res.write('' + total);
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/countiddmg/odduser.us/odduser/9/5/1 (host/world/cid/id/dmg)
app.get('/v2/max/:cid/:id/:dmg', function(req, res) {
    connect(function(err,db) {
        if (err) return console.error(err);
        db.collection('items', function(err, coll) {
            if (err) return console.error(err);
            var cid = parseInt(req.params.cid);
            var id = parseInt(req.params.id);
            var dmg = (req.params.dmg ? parseInt(req.params.dmg) : 0);
            coll.find( { cid: cid, id:id, dmg:dmg }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                    if (err) return console.error(err);
                    res.writeHead(200, {
                        "Content-Type": "text/plain",
                        "Access-Control-Allow-Origin": "*"
                    });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        var total = 0;
                        var item = items[0];
                        res.write('' + item.max);
                        res.end();
                    }
                });
            });
        });
    });
});


// http://flimp.com:3000/v1/countid/odduser.us/odduser/9/5 (host/world/cid/id)
app.get('/v1/countid/:host/:world/:cid/:id', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('items', function(err, coll) {
                if (err) return console.error(err);
            var id = parseInt(req.params.id);
            coll.find( { id:id }, { id: 1, dmg: 1, qty: 1, name: 1, _id: 0 }, function(err, cursor) {

                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "text/plain",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        var total = [];
                        var name = [];
                        for (i in items) {
                            var item = items[i];
                            if (!total[item.dmg])
                                total[item.dmg] = 0;
                            name[item.dmg] = item.name;
                            total[item.dmg] += item.qty;
                        };
                        for (i in total) {
                            res.write('' + req.params.id + ':' + i + ' ' + total[i] + ' ' + name[i].replace(/\+/g,' ') + "\n");
                        }
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/mostof
app.get('/v1/mostof', function(req, res) {

    connect(function(err,db) {
            if (err) return console.error(err);

        db.collection('item_totals', function(err, coll) {
                if (err) return console.error(err);

            var cid = parseInt(req.params.cid);
            coll.remove({},{w:1},function(err,count) {

                db.collection('items', function(err, coll) {
                        if (err) return console.error(err);

                    coll.mapReduce(
                        function() { emit( this.id+':'+this.dmg+' '+this.raw+' '+this.name.replace(/\+/g, ' '), this.qty ); },
                        function(key, values) { return Array.sum( values ) },
                        { query: { }, out: "item_totals" }, function(err,items) {

                        db.collection('item_totals', function(err, coll2) {
                            if (err) return console.error(err);

                            coll2.find({}).sort({value:-1}, function(err, cursor) {
                                if (err) return console.error(err);

                                cursor.toArray(function(err,items) {
                                    if (err) return console.error(err);

                                    res.writeHead(200, {
                                        "Content-Type": "text/plain",
                                        "Access-Control-Allow-Origin": "*"
                                    });
                                    if (items.length === 0) {
                                        res.write("end 0\n");
                                        res.end();
                                    } else {
                                        for (i in items) {
                                            var item = items[i];
                                            //console.log(item);
                                            res.write(item.value + " " + item._id + "\n");
                                        };
                                        res.end();
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/mostof
app.get('/v2/mostof/:cid', function(req, res) {

    connect(function(err,db) {
            if (err) return console.error(err);

        db.collection('item_totals', function(err, coll) {
                if (err) return console.error(err);

            var cid = parseInt(req.params.cid);
            coll.remove({cid:cid},{w:1},function(err,count) {

                db.collection('items', function(err, coll) {
                        if (err) return console.error(err);

                    coll.mapReduce(
                        function() { emit( this.id+':'+this.dmg+' '+this.raw+' '+this.name.replace(/\+/g, ' '), this.qty ); },
                        function(key, values) { return Array.sum( values ) },
                        { query: { }, out: "item_totals" }, function(err,items) {

                        db.collection('item_totals', function(err, coll2) {
                            if (err) return console.error(err);

                            coll2.find({}).sort({value:-1}, function(err, cursor) {
                                if (err) return console.error(err);

                                cursor.toArray(function(err,items) {
                                    if (err) return console.error(err);

                                    res.writeHead(200, {
                                        "Content-Type": "text/plain",
                                        "Access-Control-Allow-Origin": "*"
                                    });
                                    if (items.length === 0) {
                                        res.write("end 0\n");
                                        res.end();
                                    } else {
                                        for (i in items) {
                                            var item = items[i];
                                            //console.log(item);
                                            res.write(item.value + " " + item._id + "\n");
                                        };
                                        res.end();
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/inv
app.get('/v2/inv/?:search?', function(req, res) {

    connect(function(err,db) {
        if (err) return console.error(err);

        db.collection('item_totals', function(err, coll) {
            if (err) return console.error(err);

            coll.remove({},{w:1},function(err,count) {

                db.collection('items', function(err, coll) {
                    if (err) return console.error(err);

                    coll.mapReduce(
                        function() { emit( this.id+' '+this.dmg+' '+this.qty+' '+this.name, this.qty ); },
                        function(key, values) { return Array.sum( values ) },
                        { query: {
                            $or: [
                                { name: { $regex: req.params.search, $options: 'i' } },
                                { raw: { $regex: req.params.search, $options: 'i' } }
                            ]
                        }, out: "item_totals" }, function(err,items) {

                        db.collection('item_totals', function(err, coll2) {
                            if (err) return console.error(err);

                            coll2.find({}).sort({_id:1}, function(err, cursor) {
                                if (err) return console.error(err);

                                cursor.toArray(function(err,items) {
                                    if (err) return console.error(err);

                                    res.writeHead(200, {
                                        "Content-Type": "text/plain",
                                        "Access-Control-Allow-Origin": "*"
                                    });
                                    if (items.length === 0) {
                                        res.write("end 0\n");
                                        res.end();
                                    } else {
                                        for (i in items) {
                                            var item = items[i];
                                            //console.log(item);
                                            res.write(item._id+"\n");
                                        };
                                        res.end();
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/inv
app.get('/v1/inv/?:search?', function(req, res) {

    connect(function(err,db) {
        if (err) return console.error(err);

        db.collection('item_totals', function(err, coll) {
            if (err) return console.error(err);

            coll.remove({},{w:1},function(err,count) {

                db.collection('items', function(err, coll) {
                    if (err) return console.error(err);

                    coll.mapReduce(
                        function() { emit( this.name.replace(/\+/g, ' ')+' '+this.id+':'+this.dmg, this.qty ); },
                        function(key, values) { return Array.sum( values ) },
                        { query: {
                            $or: [
                                { name: { $regex: req.params.search, $options: 'i' } },
                                { raw: { $regex: req.params.search, $options: 'i' } }
                            ]
                        }, out: "item_totals" }, function(err,items) {

                        db.collection('item_totals', function(err, coll2) {
                            if (err) return console.error(err);

                            coll2.find({}).sort({_id:1}, function(err, cursor) {
                                if (err) return console.error(err);

                                cursor.toArray(function(err,items) {
                                    if (err) return console.error(err);

                                    res.writeHead(200, {
                                        "Content-Type": "text/plain",
                                        "Access-Control-Allow-Origin": "*"
                                    });
                                    if (items.length === 0) {
                                        res.write("end 0\n");
                                        res.end();
                                    } else {
                                        for (i in items) {
                                            var item = items[i];
                                            //console.log(item);
                                            res.write(item._id + " " + item.value + "\n");
                                        };
                                        res.end();
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/leastof
app.get('/v1/leastof', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('item_totals', function(err, coll) {
                if (err) return console.error(err);
            var id = parseInt(req.params.id);
            var dmg = (req.params.dmg ? parseInt(req.params.dmg) : 0);
            var need = (req.params.need ? parseInt(req.params.need) : 1);
            coll.find({value:{$gt:0}}).sort({value:1}).limit(10, function(err, cursor) {

                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "text/plain",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        for (i in items) {
                            var item = items[i];
                            res.write(item.value + " " + item._id + "\n");
                        };
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/findid/odduser.us/odduser/9/5/1/4 (host/world/cid/id/dmg/need)
app.get('/v1/findid/:host/:world/:cid/:id/:dmg/:need', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('items', function(err, coll) {
                if (err) return console.error(err);
            var id = parseInt(req.params.id);
            var dmg = (req.params.dmg ? parseInt(req.params.dmg) : 0);
            var need = (req.params.need ? parseInt(req.params.need) : 1);
            console.log("id:"+id+" dmg:"+dmg+" need:"+need);
            coll.find( { id:id, dmg:dmg, qty:{$gte:need} }).sort({path:1,slot:1}, function(err, cursor) {

                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "text/plain",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        for (i in items) {
                            var item = items[i];
                            res.write(item.path + " " + item.slot + " " + item.qty + " " + item.max + " " + item.id + ":" + item.dmg + " " +item.raw + " (" + item.name + ")\n");
                        };
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/findid/odduser.us/odduser/9/5/1/4 (host/world/cid/id/dmg/need)
app.get('/v2/findid/:cid/:id/:dmg/:need', function(req, res) {
    connect(function(err,db) {
        if (err) return console.error(err);
        db.collection('items', function(err, coll) {
            if (err) return console.error(err);
            var cid = parseInt(req.params.cid);
            var id = parseInt(req.params.id);
            var dmg = (req.params.dmg ? parseInt(req.params.dmg) : 0);
            var need = (req.params.need ? parseInt(req.params.need) : 1);
            coll.find( { cid:cid, id:id, dmg:dmg, qty:{$gte:need} }).sort({path:1,slot:1}, function(err, cursor) {
                if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                    if (err) return console.error(err);
                    res.writeHead(200, {
                        "Content-Type": "text/plain",
                        "Access-Control-Allow-Origin": "*"
                    });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        for (i in items) {
                            var item = items[i];
                            res.write(item.path + " " + item.slot + " " + item.qty + " " + item.max + " " + item.id + ":" + item.dmg + " " +item.raw + " (" + item.name + ")\n");
                        };
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/find/odduser.us/odduser/9/egg
app.get('/v1/find/:host/:world/:cid/:what', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('items', function(err, coll) {
                if (err) return console.error(err);
            var what = req.params.what;
            var expr = '.*' + what + '.*';
            console.log(expr);
            coll.find( { raw: { $regex: expr, $options: 'i'} } ).sort({ qty: -1, path: -1 }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "text/plain",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        for (i in items) {
                            var item = items[i];
                            res.write(item.path + " " + item.slot + " " + item.qty + " " + item.max + " " + item.id + ":" + item.dmg + " " +item.raw + " (" + item.name + ")\n");
                        };
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v1/find/odduser.us/odduser/9/egg
app.get('/v1/findspace/:host/:world/:cid/:id/:dmg', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('items', function(err, coll) {
                if (err) return console.error(err);
            var what = req.params.what;
            var expr = '.*' + what + '.*';
            console.log(expr);
            coll.find( { host: req.params.host,
                         world: req.params.world,
                         cid: parseInt(req.params.cid),
                         id: parseInt(req.params.id),
                         dmg: parseInt(req.params.dmg),
                         $where: "this.qty < this.max"
                     } ).sort({ path: -1, qty: 1 }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "text/plain",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        for (i in items) {
                            var item = items[i];
                            res.write(item.path + " " + item.slot + " " + item.qty + " " + item.max + " " + item.raw + "\n");
                        };
                        res.end();
                    }
                });
            });
        });
    });
});

// http://flimp.com:3000/v2/findspace/9/30184/0
app.get('/v2/findspace/:cid/:id/:dmg', function(req, res) {
    connect(function(err,db) {
        if (err) return console.error(err);
        db.collection('items', function(err, coll) {
            if (err) return console.error(err);
            var what = req.params.what;
            var expr = '.*' + what + '.*';
            console.log(expr);
            coll.find( { cid: parseInt(req.params.cid),
                         id: parseInt(req.params.id),
                         dmg: parseInt(req.params.dmg),
                         $where: "this.qty < this.max"
                     } ).sort({ path: -1, qty: 1 }, function(err, cursor) {
                if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                    if (err) return console.error(err);
                    res.writeHead(200, {
                        "Content-Type": "text/plain",
                        "Access-Control-Allow-Origin": "*"
                    });
                    if (items.length === 0) {
                        res.write("end 0\n");
                        res.end();
                    } else {
                        for (i in items) {
                            var item = items[i];
                            res.write(item.path + " " + item.slot + " " + item.qty + " " + item.max + " " + item.raw + "\n");
                        };
                        res.end();
                    }
                });
            });
        });
    });
});

app.get('/v1/items/:key/:val', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('items', function(err, coll) {
                if (err) return console.error(err);
            var k = req.params.key
            var v = req.params.val
            var regex = false;
            if (v.substring(0,1) === "~") {
                v = '/'+v.substring(1,v.length)+'/';
                regex = true;
            }
            criteria = [];
            criteria[k] = v;
            console.log(criteria);
            coll.find(criteria, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "application/json",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                    res.write("[");
                    for (i in items) {
                        res.write(JSON.stringify(items[i]) + ",");
                    };
                    res.write("{}]");
                    res.end();
                });
            });
        });
    });
});

app.get('/v1/log/:label/:cid/:text', function(req, res) {
        connect(function(err,db) {
            if (err) return console.error(err);
                db.collection('log', function(err, coll) {
                        if (err) return console.error(err);
            var newrec = {
                'label': req.params.label, // computer label
                'host': req.params.host, // server IP
                'cid': parseInt(req.params.cid), // computer ID
                'text': req.params.text, // direction chest faces
                'ts': new Date()
            };
            coll.insert(newrec, {"safe":true}, function(err, docs) {
                if (err) return console.error(err);
                res.writeHead(200, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                });
                console.log(docs.cid+" "+docs.text);
                res.write(JSON.stringify(docs));
                res.end();
            });
                });
        });
});

app.get('/v3/recipe', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('v3recipe', function(err, coll) {
                if (err) return console.error(err);
            coll.find({ step:1 }).sort({ goal:1 }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                    if (items.length > 0) {
                        res.writeHead(200, {
                            "Content-Type": "text/plain",
                            "Access-Control-Allow-Origin": "*"
                        });
                        var q = parseInt(req.params.qty ? req.params.qty : 1);
                        for (i in items) {
                            var item = items[i];
                            var out =
                                item['id']          + ':' +
                                item['dmg']         + ' ' +
                                item['goal']        + '\n';
                            res.write(out);
                        };
                    } else {
                        res.writeHead(404);
                    }
                    res.end();
                });
            });
        });
    });
});

app.get('/v3/recipelinks', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('v3recipe', function(err, coll) {
                if (err) return console.error(err);
            coll.find({ step:1 }).sort({ goal:1 }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                    if (items.length > 0) {
                        res.writeHead(200, {
                            "Content-Type": "text/html",
                            "Access-Control-Allow-Origin": "*"
                        });
                        var q = parseInt(req.params.qty ? req.params.qty : 1);
                        for (i in items) {
                            var item = items[i];
                            var out =
                                '<a href=http://flimp.com:3000/v3/recipe/' + item['id'] + '/' + item['dmg'] + '>' +
                                item['id']          + ':' +
                                item['dmg']         + ' ' +
                                item['goal']        + '</a><br />\n';
                            res.write(out);
                        };
                    } else {
                        res.writeHead(404);
                    }
                    res.end();
                });
            });
        });
    });
});

// GET /v3/newid/25363 404 1ms

app.get('/v3/newid/:id', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('newid', function(err, coll) {
                if (err) return console.error(err);
            coll.find({
                oldid: parseInt(req.params.id)
            }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                    if (items.length > 0) {
                        res.writeHead(200, {
                            "Content-Type": "text/plain",
                            "Access-Control-Allow-Origin": "*"
                        });
                        var item = items[0];
                        res.write(item['newid']);
                    } else {
                        res.write('?');
                    }
                    res.end();
                });
            });
        });
    });
});

app.get('/v3/mod/:id', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('idinfo', function(err, coll) {
                if (err) return console.error(err);
            coll.find({
                _id: parseInt(req.params.id)
            }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                    if (items.length > 0) {
                        res.writeHead(200, {
                            "Content-Type": "text/plain",
                            "Access-Control-Allow-Origin": "*"
                        });
                        var item = items[0];
                        res.write(item['mod']);
                    } else {
                        res.writeHead(404);
                    }
                    res.end();
                });
            });
        });
    });
});

app.get('/v3/name/:id/:dmg', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('itempanel', function(err, coll) {
                if (err) return console.error(err);
            coll.find({
                id: parseInt(req.params.id),
                dmg: parseInt(req.params.dmg)
            }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                    if (items.length > 0) {
                        res.writeHead(200, {
                            "Content-Type": "text/plain",
                            "Access-Control-Allow-Origin": "*"
                        });
                        var item = items[0];
                        res.write(item['name']);
                    } else {
                        res.writeHead(404);
                    }
                    res.end();
                });
            });
        });
    });
});

app.get('/v3/recipe/:id/:dmg/:qty?', function(req, res) {
    connect(function(err,db) {
            if (err) return console.error(err);
        db.collection('v3recipe', function(err, coll) {
                if (err) return console.error(err);
            coll.find({
                id: parseInt(req.params.id),
                dmg: parseInt(req.params.dmg)
            }, function(err, cursor) {
                    if (err) return console.error(err);
                cursor.toArray(function(err,items) {
                        if (err) return console.error(err);
                    if (items.length > 0) {
                        res.writeHead(200, {
                            "Content-Type": "text/plain",
                            "Access-Control-Allow-Origin": "*"
                        });
                        var q = parseInt(req.params.qty ? req.params.qty : 1);
                        res.write('_id/_dmg/step/id/dmg/make/use/slots/piece/goal\n');
                        for (i in items) {
                            var item = items[i];
                            var out =
                                item['id']          + '/' +
                                item['dmg']         + '/' +
                                item['step']        + '/' +
                                item['cid']         + '/' +
                                item['cdmg']        + '/' +
                                item['make']    * q + '/' +
                                item['use']     * q + '/' +
                                item['slots']       + '/' +
                                item['piece']       + '/' +
                                item['goal']        + '\n';
                            res.write(out);
                        };
                    } else {
                        res.writeHead(404);
                    }
                    res.end();
                });
            });
        });
    });
});

app.post('/v3/recipe/:id/:dmg/:step/:cid/:cdmg/:make/:use/:slots/:piece/:goal', function(req, res) {
        connect(function(err,db) {
            if (err) return console.error(err);
                db.collection('v3recipe', function(err, coll) {
                        if (err) return console.error(err);
                        coll.remove({
                                'id': req.params.id,
                                'dmg': parseInt(req.params.dmg),
                                'step': parseInt(req.params.step)
                        }, { w: 1 }, function (err, count) {
                                var newrec = {
                    'id': req.params.id,
                                        'dmg': parseInt(req.params.dmg),
                                        'step': parseInt(req.params.step),
                                        'cid': parseInt(req.params.cid),
                                        'cdmg': parseInt(req.params.cdmg),
                                        'make': parseInt(req.params.make),
                                        'use': parseInt(req.params.use),
                                        'slots': req.params.slots,
                                        'piece': req.params.piece,
                                        'goal': req.params.goal
                                };
                                coll.insert(newrec, {"safe":true, "upsert":true}, function(err, docs) {
                                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "application/json",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                                        res.write(JSON.stringify(docs));
                                        res.end();
                                });
                        });
                });
        });
});

// {
//      "dfpath" : "ow0",
//      "slot" : NaN,
//      "item" : {
//          "item" : "{\"dmg\":4,\"max_size\":64,\"raw_name\":\"tile.thermaldynamics.duct.energyresonant\",\"qty\":6,\"slot\":758,\"display_name\":\"Resonant Fluxduct\",\"path\":\"0\",\"facing\":\"west\",\"name\":\"ThermalDynamics_0\",\"ore_dict\":[],\"dir\":\"front\",\"max_dmg\":0,\"id\":\"ThermalDynamics:ThermalDynamics_0\",\"mod_id\":\"ThermalDynamics\",\"ore_dicts\":\"\"}"
//      },
//      "_id" : ObjectId("5a00ef7eb20f918f1000ef23")
// }

// { item: '{"dmg":4,"max_size":64,"raw_name":"item.dyepowder.blue","qty":64,"slot":40,"display_name":"Lapis Lazuli","path":"0","facing":"west","name":"dye","ore_dict":{"dyeBlue":true,"gemLapis":true,"dye":true},"dir":"front","max_dmg":0,"id":"minecraft:dye","mod_id":"minecraft","ore_dicts":"dyeBlue gemLapis dye"}' }

// GET /v5/items/front/west/0/14/minecraft.glowstone.0.Glowstone.glowstone 404 9ms
//
app.get('/v5/items/:dir/:facing/:path/:slot/:item', function(req, res) {
        connect(function(err,db) {
            if (err) return console.error(err);
                db.collection('v5items', function(err, coll) {
                        if (err) return console.error(err);
                        coll.remove({
                'dir': req.params.dir,
                'facing': req.params.facing,
                'path': req.params.path,
                'slot': parseInt(req.params.slot),
                'item': req.params.item,
            }, { w: 1 }, function (err, count) {
                res.writeHead(200, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                });
                var newrec = {
                    'dir': req.params.dir,
                    'facing': req.params.facing,
                    'path': req.params.path,
                    'slot': parseInt(req.params.slot),
                    'item': req.params.item,
                };
                console.log(newrec);
                coll.insert(newrec, {"safe":true,"upsert":true}, function(err, docs) {
                    if (err) return console.error(err);
                    res.write(JSON.stringify(docs));
                    res.end();
                });
                        });
                });
        });
});

//   POST /v1/items/odd2/1/nubcake/minecraft:gunpowder/0/64/gunpowder/d2f/2/item.sulphur/1/tazzer 404 8ms

app.post('/v1/items/:label/:cid/:host/:id/:dmg/:max/:name/:path/:qty/:raw/:slot/:world/:dist/:facing', function(req, res) {
        connect(function(err,db) {
            if (err) return console.error(err);
                db.collection('items', function(err, coll) {
                        if (err) return console.error(err);
                        coll.remove({
                                'host': req.params.host,
                                'world': req.params.world,
                                'cid': req.params.cid,
                'path': req.params.path,
                                'slot': parseInt(req.params.slot),
                        }, { w: 1 }, function (err, count) {
                                var newrec = {
                    'label': req.params.label, // computer label
                                        'cid': parseInt(req.params.cid), // computer ID
                                        'host': req.params.host, // server IP
                                        'id': req.params.id, // item ID
                                        'dmg': parseInt(req.params.dmg), // item damage
                                        'max': parseInt(req.params.max), // max items
                                        'name': req.params.name, // Item Name
                                        'path': req.params.path, // path to inv
                                        'qty': parseInt(req.params.qty), // count in slot
                                        'raw': req.params.raw, // item.name
                                        'slot': parseInt(req.params.slot), // slot number
                                        'world': req.params.world, // X coord of inv
                                        'dist': parseInt(req.params.dist), // dist = # of movements
                                        'facing': req.params.facing, // direction chest faces
                    'avail': parseInt(req.params.max) - parseInt(req.params.qty)
                                };
                                coll.insert(newrec, {"safe":true}, function(err, docs) {
                                        if (err) return console.error(err);
                                        res.writeHead(200, {
                                                "Content-Type": "application/json",
                                                "Access-Control-Allow-Origin": "*"
                                        });
                                        res.write(JSON.stringify(docs));
                                        res.end();
                                });
                        });
                });
        });
});

app.get('/v2/recipe', function(req, res) {
   res.render('recipe');
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
