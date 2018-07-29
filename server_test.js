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
  const myAwesomeDB = database.db('bets');

  if (err) return console.log(err);

  function start() {
    let filteredResults = [];

    rp('https://api.betsapi.com/v2/events/inplay?sport_id=1&token=8334-BCLtMmtKT698vk')
      .then(function (response) {
        console.log('запрос events');

        let results = JSON.parse(response).results;

        filteredResults = _.filter(results, function(item) {
          if (item.timer) {
            return item.timer.tm === 20 && showedEvents.indexOf(item.id) === -1
          } else {
            return false
          }

        });

        _.forEach(filteredResults, function(item) {

          rp('https://api.betsapi.com/v1/event/view?token=8334-BCLtMmtKT698vk&event_id=' + item.id)
            .then(function (response2) {
              console.log('запрос view');

              let view = JSON.parse(response2).results[0];

              for(let key in view.stats) {
                view.stats[key] = _.map(view.stats[key], function(item) {
                  return parseInt(item)
                })
              }
              item.view = view;

              if (true) {

                rp('https://api.betsapi.com/v1/event/odds?token=8334-BCLtMmtKT698vk&event_id=' + item.id)
                  .then(function (response3) {
                    console.log('запрос odds');
                    let odds = JSON.parse(response3).results;

                    item.odds = odds;

                    if (true) {
                      showedEvents.push(item.id);

                      rp('https://api.betsapi.com/v1/event/history?token=8334-BCLtMmtKT698vk&event_id=' + item.id)
                        .then(function (response4) {
                          console.log('запрос history');

                          let history = JSON.parse(response4).results;
                          item.history = history;

                          myAwesomeDB.collection('notes').insert(item, (err, result) => {
                            if (err) {
                              console.log(err);
                            } else {
                              console.log(result.ops[0]);
                            }
                          });

                        })
                        .catch(function (err) {
                          console.log('request history failed' + err)
                        });
                    }

                  })
                  .catch(function (err) {
                    console.log('request odds failed' + err)
                  });
              }
            })
            .catch(function (err) {
              console.log('request view failed' + err)
            });
        })
      })
      .catch(function (err) {
        console.log('request events failed' + err)
      });
  }

  start();


  setInterval(start, 60000);
})



