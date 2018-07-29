const express        = require('express');
const MongoClient    = require('mongodb').MongoClient;
const bodyParser     = require('body-parser');
const db             = require('./config/db');
const app            = express();
const rp = require('request-promise');
const _ = require('lodash');

const unicodeScores = ['\u0030\u20E3', '\u0031\u20E3', '\u0032\u20E3', '\u0033\u20E3', '\u0034\u20E3', '\u0035\u20E3', '\u0036\u20E3', '\u0037\u20E3'];
let showedEvents = [];

MongoClient.connect(db.url, (err, database) => {
  const DB = database.db('bets');

  if (err) return console.log(err);

  var bulk = DB.collection('notes').initializeOrderedBulkOp();
  var counter = 0;
  DB.collection('notes').find().forEach( function (x) {
    console.log(x)
    x.resultView = {result: '1-1'};
    DB.collection('notes').save(x);
  });

})



