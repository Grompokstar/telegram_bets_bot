process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const rp = require('request-promise');
const _ = require('lodash');
const token = '515855036:AAEY-jgjNUA8ZKu7DyiLhXqY71PVKj4nxK4';
const bot = new TelegramBot(token, {polling: true});

function start() {
  var filteredResults = [];

  rp('https://api.betsapi.com/v2/events/inplay?sport_id=1&token=8334-BCLtMmtKT698vk')
    .then(function (response) {
      console.log('запрос events')

      let results = JSON.parse(response).results;

      filteredResults = _.filter(results, function(item) {
        let scores = parseInt(item.scores[2].home) + parseInt(item.scores[2].away);

        return item.timer.tm === 22
      });

      _.forEach(filteredResults, function(item) {

        rp('https://api.betsapi.com/v1/event/view?token=8334-BCLtMmtKT698vk&event_id=' + item.id)
          .then(function (response2) {
            console.log('запрос view');

            let view = JSON.parse(response2).results[0];

            /*_.forEach(filteredResults, function(item) {
              if (view.id === item.id) {
                item.view = view;
              }
            });*/
            let dangerAttacksDif = Math.abs(parseInt(view.stats.dangerous_attacks[0]) - parseInt(view.stats.dangerous_attacks[1]));
            let goalsOnTarget = parseInt(view.stats.on_target[0]) + parseInt(view.stats.on_target[1]);

            if (dangerAttacksDif >= 10 && goalsOnTarget >= 3) {

              rp('https://api.betsapi.com/v1/event/odds?token=8334-BCLtMmtKT698vk&event_id=' + item.id + '&odds_market=3')
                .then(function (response3) {
                  console.log('запрос odds');
                  let jsonOdds = JSON.parse(response3).results['1_3'];
                  let odd = jsonOdds[jsonOdds.length - 1];

                  if (odd.handicap >= 2.5) {

                    rp('https://api.betsapi.com/v1/event/history?token=8334-BCLtMmtKT698vk&event_id=' + item.id)
                      .then(function (response4) {
                        console.log('запрос history');
                        let homeArray = JSON.parse(response4).results['home'];
                        let awayArray = JSON.parse(response4).results['away'];

                        let sumHomeGoals = 0;

                        _.forEach(homeArray, function (match) {
                          let scoreArray = match.ss.split('-');

                          sumHomeGoals += parseInt(scoreArray[0]) + parseInt(scoreArray[1])
                        });

                        let averageHomeGoals = sumHomeGoals / homeArray.length;

                        let sumAwayGoals = 0;

                        _.forEach(awayArray, function (match) {
                          let scoreArray = match.ss.split('-');

                          sumAwayGoals += parseInt(scoreArray[0]) + parseInt(scoreArray[1])
                        });

                        let averageAwayGoals = sumAwayGoals / awayArray.length;

                        let homeName = item.home.name.split(' ').join('-');
                        let awayName = item.away.name.split(' ').join('-');

                        let message = '';
                        message += 'Лига: ' + item.league.name + "\n";
                        message += '<b>' + item.home.name + ' ' + item.ss + ' ' + item.away.name + "</b>\n" + item.timer.tm + ' минута ';
                        message += "<a href=\'https://ru.betsapi.com/r/" + item.id + "/" + averageHomeGoals + "-v-" + awayName + "\'>Подробно</a>\n";
                        message += odd.over_od + '/' + odd.handicap;
                        message += "\n" + 'Среднее голов за 10 матчей: ' + averageHomeGoals + '-' + averageAwayGoals;
                        if (view.stats) {
                          message += "\n\n" + 'Атаки: ' + view.stats.attacks[0] + '-' + view.stats.attacks[1];
                          message += "\n" + 'Опасные атаки: ' + view.stats.dangerous_attacks[0] + '-' + view.stats.dangerous_attacks[1];
                          message += "\n" + 'Удары в створ: ' + view.stats.on_target[0] + '-' + view.stats.on_target[1];
                          message += "\n" + 'Удары мимо ворот: ' + view.stats.off_target[0] + '-' + view.stats.off_target[1];
                          message += "\n" + 'Угловые: ' + view.stats.corners[0] + '-' + view.stats.corners[1];
                          message += "\n" + 'Пенальти: ' + view.stats.penalties[0] + '-' + view.stats.penalties[1];
                          message += "\n" + 'Красные: ' + view.stats.redcards[0] + '-' + view.stats.redcards[1];
                          message += "\n" + 'Желтые: ' + view.stats.yellowcards[0] + '-' + view.stats.yellowcards[1];
                          if (view.stats.possession_rt) {
                            message += "\n" + 'Владение: ' + view.stats.possession_rt[0] + '-' + view.stats.possession_rt[1];
                          }
                        }

                        bot.sendMessage('@roma_best_football_bets', message, { parse_mode: "HTML" });
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
