process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const rp = require('request-promise');
const _ = require('lodash');
const token = '515855036:AAEY-jgjNUA8ZKu7DyiLhXqY71PVKj4nxK4';
const bot = new TelegramBot(token, {polling: true});

var https = require('https');


function start() {
  var filteredResults = [];

  rp('https://api.betsapi.com/v2/events/inplay?sport_id=1&token=8334-BCLtMmtKT698vk')
    .then(function (response) {
      console.log('запрос events')

      let results = JSON.parse(response).results;

      filteredResults = _.filter(results, function(item) {
        let scores = parseInt(item.scores[2].home) + parseInt(item.scores[2].away);
        return (item.ss === '0-0' && item.timer.tm === 20) || (scores <= 2 && item.timer.tm === 60)
      });

      _.forEach(filteredResults, function(item) {

        rp('https://api.betsapi.com/v1/event/view?token=8334-BCLtMmtKT698vk&event_id=' + item.id)
          .then(function (response2) {
            console.log('запрос view');

            let view = JSON.parse(response2).results[0];

            _.forEach(filteredResults, function(item) {
              if (view.id === item.id) {
                item.view = view;
              }
            });

            rp('https://api.betsapi.com/v1/event/odds?token=8334-BCLtMmtKT698vk&event_id=' + item.id + '&odds_market=3')
              .then(function (response3) {
                console.log('запрос odds');
                let jsonOdds = JSON.parse(response3).results['1_3'];
                let odd = jsonOdds[jsonOdds.length - 1];

                if (odd.over_od <= 1.5) {

                  let homeName = item.home.name.split(' ').join('-');
                  let awayName = item.away.name.split(' ').join('-');

                  let message = '';
                  message += 'Лига: ' + item.league.name + "\n";
                  message += '<b>' + item.home.name + ' ' + item.ss + ' ' + item.away.name + "</b>\n" + item.timer.tm + ' минута ';
                  message += "<a href=\'https://ru.betsapi.com/r/" + item.id + "/" + homeName + "-v-" +  awayName + "\'>Подробно</a>\n";
                  message += odd.over_od + '/' + odd.handicap;
                  if (item.view.stats) {
                    message += "\n\n" + 'Атаки: ' + item.view.stats.attacks[0] + '-' +  item.view.stats.attacks[1];
                    message += "\n" + 'Опасные атаки: ' + item.view.stats.dangerous_attacks[0] + '-' +  item.view.stats.dangerous_attacks[1];
                    message += "\n" + 'Удары в створ: ' + item.view.stats.on_target[0] + '-' +  item.view.stats.on_target[1];
                    message += "\n" + 'Удары мимо ворот: ' + item.view.stats.off_target[0] + '-' +  item.view.stats.off_target[1];
                    message += "\n" + 'Угловые: ' + item.view.stats.corners[0] + '-' +  item.view.stats.corners[1];
                    message += "\n" + 'Пенальти: ' + item.view.stats.penalties[0] + '-' +  item.view.stats.penalties[1];
                    message += "\n" + 'Красные: ' + item.view.stats.redcards[0] + '-' +  item.view.stats.redcards[1];
                    message += "\n" + 'Желтые: ' + item.view.stats.yellowcards[0] + '-' +  item.view.stats.yellowcards[1];
                    if (item.view.stats.ball_safe) {
                      message += "\n" + 'Мяч вне атаки: ' + item.view.stats.ball_safe[0] + '-' + item.view.stats.ball_safe[1];
                    }
                  }

                  bot.sendMessage('@roma_best_football_bets', message, { parse_mode: "HTML" });
                }
              })
              .catch(function (err) {
                console.log('request odds failed' + err)
              });
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
