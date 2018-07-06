process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const { InlineKeyboard, ReplyKeyboard, ForceReply } = require('telegram-keyboard-wrapper');
const rp = require('request-promise');
const _ = require('lodash');
const mainToken = '515855036:AAEY-jgjNUA8ZKu7DyiLhXqY71PVKj4nxK4';
const testToken = '571233425:AAEuaeoImFHtepoZxIjKxV9DP-T4M-zAgu0';
const bot = new TelegramBot(mainToken, {polling: true});
const testChannelName = '@test_telegram_bots';
const zaryadPlusChannel = '@betbomb_zaryad_plus';
const zaryadPlusCommonChannel = '@betbomb_zaryad_common';
const mainChannelName = '@roma_best_football_bets';
const testChannelId = -1001259208814;

const unicodeScores = ['\u0030\u20E3', '\u0031\u20E3', '\u0032\u20E3', '\u0033\u20E3', '\u0034\u20E3', '\u0035\u20E3', '\u0036\u20E3', '\u0037\u20E3'];
let showedEvents = [];


setInterval(function() {
  showedEvents = [];
}, 7200000);

bot.on("callback_query", function(query) {
  console.log('callback_query');
  //console.log(query);

  rp('https://api.betsapi.com/v1/event/view?token=8334-BCLtMmtKT698vk&event_id=' + query.data)
    .then(function(viewRequest) {
      console.log('запрос callback_view');
      let viewReq = JSON.parse(viewRequest).results[0];

      let scoresText = viewReq.scores["2"].home + ':' + viewReq.scores["2"].away;
      if (viewReq.scores["1"]) {
        scoresText += ' (' + viewReq.scores["1"].home + ':' + viewReq.scores["1"].away + ')';
      }

      let finishStr = '';

      if (viewReq.time_status === '1' ) {
        finishStr = " \u23F0" + viewReq.timer.tm + "\'";
      } else if (viewReq.time_status === '3') {
        finishStr = " \u{1F3C1}";
      }

      bot.answerCallbackQuery(query.id, { text: scoresText + finishStr})
    })

});

function start() {
  let filteredResults = [];

  rp('https://api.betsapi.com/v2/events/inplay?sport_id=1&token=8334-BCLtMmtKT698vk')
    .then(function (response) {
      console.log('запрос events');
      let totalScores = [];

      let results = JSON.parse(response).results;

      filteredResults = _.filter(results, function(item) {
        totalScores.push({itemId: item.id, scores: parseInt(item.scores[2].home) + parseInt(item.scores[2].away)});

        if (item.timer) {
          return item.timer.tm >= 19 && item.timer.tm <= 24 && showedEvents.indexOf(item.id) === -1
        } else {
          return false
        }

      });

      _.forEach(filteredResults, function(item) {

        rp('https://api.betsapi.com/v1/event/view?token=8334-BCLtMmtKT698vk&event_id=' + item.id)
          .then(function (response2) {
            console.log('запрос view');

            let view = JSON.parse(response2).results[0];
            let dangerAttacksDif = Math.abs(parseInt(view.stats.dangerous_attacks[0]) - parseInt(view.stats.dangerous_attacks[1]));
            let goalsOnTarget = parseInt(view.stats.on_target[0]) + parseInt(view.stats.on_target[1]);
            let dangerAttacksKef;

            if (parseInt(view.stats.dangerous_attacks[0]) > parseInt(view.stats.dangerous_attacks[1])) {
              dangerAttacksKef = parseInt(view.stats.dangerous_attacks[0])/parseInt(view.stats.dangerous_attacks[1]);
            } else {
              dangerAttacksKef = parseInt(view.stats.dangerous_attacks[1])/parseInt(view.stats.dangerous_attacks[0]);
            }

            if (dangerAttacksKef >= 2.5 && dangerAttacksDif >= 8 && goalsOnTarget >= 3) {

              rp('https://api.betsapi.com/v1/event/odds?token=8334-BCLtMmtKT698vk&event_id=' + item.id + '&odds_market=1,3,6')
                .then(function (response3) {
                  console.log('запрос odds');
                  let jsonOdds = JSON.parse(response3).results['1_3'];
                  let resultOdds = JSON.parse(response3).results['1_1'];
                  let firstHalfOdds = JSON.parse(response3).results['1_6'];
                  let odd = jsonOdds[jsonOdds.length - 1];
                  let resultOdd;
                  let currentResultOdd;
                  let firstHalfOdd;

                  if (resultOdds) {
                    resultOdd = resultOdds[resultOdds.length - 1];
                    currentResultOdd = resultOdds[0];
                  }

                  if (firstHalfOdds) {
                    firstHalfOdd = firstHalfOdds[0];
                  }

                  let handicapArray = odd.handicap.split(',');

                  let score = _.find(totalScores, function(scoreItem) {
                    return scoreItem.itemId === item.id
                  });

                  let goalsFilter = parseFloat(handicapArray[handicapArray.length - 1])/score.scores;
                  console.log(goalsFilter);

                  if (goalsFilter >= 2) {

                    rp('https://api.betsapi.com/v1/event/history?token=8334-BCLtMmtKT698vk&event_id=' + item.id)
                      .then(function (response4) {
                        console.log('запрос history');
                        let homeArray = JSON.parse(response4).results['home'];
                        let awayArray = JSON.parse(response4).results['away'];

                        let sumHomeGoals = 0;

                        _.forEach(homeArray, function (match) {
                          if (match.ss) {
                            let scoreArray = match.ss.split('-');

                            sumHomeGoals += parseInt(scoreArray[0]) + parseInt(scoreArray[1])
                          }

                        });

                        let averageHomeGoals = (sumHomeGoals / homeArray.length).toFixed(1);
                        if(isNaN(averageHomeGoals)) {
                          averageHomeGoals = '-'
                        }

                        let sumAwayGoals = 0;

                        _.forEach(awayArray, function (match) {
                          if (match.ss) {
                            let scoreArray = match.ss.split('-');

                            sumAwayGoals += parseInt(scoreArray[0]) + parseInt(scoreArray[1])
                          }
                        });

                        let averageAwayGoals = (sumAwayGoals / awayArray.length).toFixed(1);
                        if(isNaN(averageAwayGoals)) {
                          averageAwayGoals = '-'
                        }

                        let homeName = item.home.name ? item.home.name.split(' ').join('-') : '';
                        let awayName = item.away.name ? item.away.name.split(' ').join('-') : '';

                        let goalsArray;

                        if (item.ss) {
                          goalsArray = item.ss.split('-');
                        }

                        var averageGoalsFilterMain = (parseFloat(averageHomeGoals) + parseFloat(averageAwayGoals))/2;
                        var averageGoalsFilter = (parseFloat(averageHomeGoals) + parseFloat(averageAwayGoals))/2 - parseInt(score.scores);

                        let message = '';
                        let messageCommon = '';

                        message += '\u26BD ' + item.league.name + "\n";
                        message += '<b>' + item.home.name + ' ' + unicodeScores[goalsArray[0]] + '-' + unicodeScores[goalsArray[1]]  + ' ' + item.away.name + "</b> \u23F0 <i>" + item.timer.tm + "\'</i>\n";
                        message += odd.over_od + '/' + odd.handicap;

                        message += "<i>\n\n" + 'Голы за 10 матчей: ' + averageHomeGoals + '-' + averageAwayGoals;
                        if (resultOdds) {
                          message += "\n" + 'Коэфициенты: ' + resultOdd.home_od + '-' + resultOdd.away_od + ' => ' + currentResultOdd.home_od + '-' + currentResultOdd.away_od;
                        }

                        if (view.stats) {
                          message += "\n" + 'Атаки: ' + view.stats.attacks[0] + '-' + view.stats.attacks[1];
                          message += "\n" + 'Опасные атаки: ' + view.stats.dangerous_attacks[0] + '-' + view.stats.dangerous_attacks[1];
                          message += "\n" + 'Удары в створ: ' + view.stats.on_target[0] + '-' + view.stats.on_target[1];
                          message += "\n" + 'Удары мимо ворот: ' + view.stats.off_target[0] + '-' + view.stats.off_target[1];
                          message += "\n" + 'Угловые: ' + view.stats.corners[0] + '-' + view.stats.corners[1];
                          message += "\n" + 'Пенальти: ' + view.stats.penalties[0] + '-' + view.stats.penalties[1];
                          message += "\n" + 'Красные: ' + view.stats.redcards[0] + '-' + view.stats.redcards[1];
                          message += "\n" + 'Желтые: ' + view.stats.yellowcards[0] + '-' + view.stats.yellowcards[1];
                          if (view.stats.possession_rt) {
                            message += "\n" + 'Владение мячом: ' + view.stats.possession_rt[0] + '-' + view.stats.possession_rt[1];
                          }

                          message += "</i>"
                        }

                        message += "\n\n";
                        if (firstHalfOdd) {
                          message += '(' + firstHalfOdd.over_od + '/' + firstHalfOdd.handicap + ')'
                        }
                        message += "\n\u{1F4B0}<b>Тотал 1-го тайма " + score.scores + '.5 Б</b>';

                        const ik = new InlineKeyboard();

                        ik.addRow(
                          { text: "\u26BD Счет", callback_data: item.id },
                          { text: "\u{1F30F} Подробно", url: "https://ru.betsapi.com/r/" + item.id + "/" + homeName + "-v-" + awayName }
                        );

                        let ikExport = ik.export();



                        messageCommon += item.league.name + "\u23F0 <i>" + item.timer.tm + "\'</i>\n";
                        messageCommon += '<b>' + item.home.name + ' ' + unicodeScores[goalsArray[0]] + '-' + unicodeScores[goalsArray[1]]  + ' ' + item.away.name + "</b>";
                        messageCommon += '\n' + odd.over_od + '/' + odd.handicap;

                        messageCommon += '\n\n\u26BD ' + averageHomeGoals + '-' + averageAwayGoals;
                        if (resultOdds) {
                          messageCommon += "\n\n" + '\u2696 ' + resultOdd.home_od + '-' + resultOdd.away_od + ' => ' + currentResultOdd.home_od + '-' + currentResultOdd.away_od;
                        }

                        if (view.stats) {
                          if (view.stats.possession_rt) {
                            messageCommon += "\n\n" + '\u{1F4C8} ' + view.stats.possession_rt[0] + '-' + view.stats.possession_rt[1];
                          }
                        }

                        messageCommon += "\n\n";
                        if (firstHalfOdd) {
                          messageCommon += '(' + firstHalfOdd.over_od + '/' + firstHalfOdd.handicap + ')'
                        }
                        messageCommon += "\n<b>Тотал 1-го тайма " + score.scores + '.5 Б</b>';

                        const ik2 = new InlineKeyboard();

                        ik2.addRow(
                          { text: "\u26BD Счет", callback_data: item.id },
                        );

                        let ikExport2 = ik2.export();

                        let options = Object.assign({}, {parse_mode: 'HTML'}, ikExport);
                        let optionsCommon = Object.assign({}, {parse_mode: 'HTML'}, ikExport2);



                        if (averageGoalsFilterMain >= 3) {
                          showedEvents.push(item.id);
                          bot.sendMessage(mainChannelName, message, options);
                          bot.sendMessage(zaryadPlusCommonChannel, messageCommon, optionsCommon);
                        }

                        if (averageGoalsFilter >= 3) {
                          showedEvents.push(item.id);
                          bot.sendMessage(zaryadPlusChannel, message, options);
                        }

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
