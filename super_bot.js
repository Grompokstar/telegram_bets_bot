process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const { InlineKeyboard, ReplyKeyboard, ForceReply } = require('telegram-keyboard-wrapper');
const rp = require('request-promise');
const _ = require('lodash');
const token = '606147749:AAERzAs4sGKrwKsqjJ2XacuPLs21719shhc';
const bot = new TelegramBot(token, {polling: true});
const mainTestChannel = '@betbomb_test_channel';
const zaryadPlusCommonChannel = '@betbomb_zaryad_common';
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
        bot.answerCallbackQuery(query.id, { text: scoresText + finishStr})

      } else if (viewReq.time_status === '3') {
        let editText = query.message.text;

        if (query.message.text.indexOf('Победа') > 0) {
          let recommend = query.message.text.substr(query.message.text.indexOf('Победа') + 7, 1);
          if (recommend === '1'&& parseInt(viewReq.scores["2"].home) > parseInt(viewReq.scores["2"].away)) {
            editText += '\u2705'
          } else if (recommend === '2' && parseInt(viewReq.scores["2"].home) < parseInt(viewReq.scores["2"].away)) {
            editText += '\u2705'
          } else {
            editText += '\u274C'
          }
        }


        editText += '\n\n<b>Итоговый счет: ' + scoresText + ' \u{1F3C1}</b>';
        bot.editMessageText(editText, {parse_mode: 'HTML', chat_id: query.message.chat.id, message_id: query.message.message_id});

      }

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
        totalScores.push({itemId: item.id, scores: parseInt(item.scores['2'].home) + parseInt(item.scores['2'].away)});
        let totalGoals = parseInt(item.scores['2'].home) + parseInt(item.scores['2'].away);

        let leagueNameFilter = ['70', '80'];

        if (item.timer) {
          return item.timer.tm === 20 && showedEvents.indexOf(item.id) === -1 && totalGoals <= 0
        } else {
          return false
        }

      });

      _.forEach(filteredResults, function(item) {

        rp('https://api.betsapi.com/v1/event/view?token=8334-BCLtMmtKT698vk&event_id=' + item.id)
          .then(function (response2) {
            console.log('запрос view');

            let view = JSON.parse(response2).results[0];
            let attacksSumm = parseInt(view.stats.attacks[0]) + parseInt(view.stats.attacks[1]);
            let dangerAttacksSumm = parseInt(view.stats.dangerous_attacks[0]) + parseInt(view.stats.dangerous_attacks[1]);
            let goalsOnTarget = parseInt(view.stats.on_target[0]) + parseInt(view.stats.on_target[1]);

            let dangerAttacksKef;

            if (parseInt(view.stats.dangerous_attacks[0]) > parseInt(view.stats.dangerous_attacks[1])) {
              dangerAttacksKef = parseInt(view.stats.dangerous_attacks[0])/parseInt(view.stats.dangerous_attacks[1]);
            } else {
              dangerAttacksKef = parseInt(view.stats.dangerous_attacks[1])/parseInt(view.stats.dangerous_attacks[0]);
            }


            if (dangerAttacksKef >= 2.6) {
              rp('https://api.betsapi.com/v1/event/odds?token=8334-BCLtMmtKT698vk&event_id=' + item.id + '&odds_market=1,3,6')
                .then(function (response3) {
                  console.log('запрос odds');
                  let jsonOdds = JSON.parse(response3).results['1_3'];
                  let resultOdds = JSON.parse(response3).results['1_1'];
                  let firstHalfOdds = JSON.parse(response3).results['1_6'];
                  let odd;
                  let currentTotalOdd = jsonOdds[0];
                  let resultOdd;
                  let currentResultOdd;
                  let firstHalfOdd;
                  if (jsonOdds) {
                    odd = jsonOdds[jsonOdds.length - 1];
                  }

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

                  //let goalsFilter = parseFloat(handicapArray[handicapArray.length - 1])/score.scores;

                  let dangerAttacksKef2 = parseInt(view.stats.dangerous_attacks[0])/parseInt(view.stats.dangerous_attacks[1]);

                  if (odd  && (odd.over_od <= 1.75 || parseFloat(handicapArray[0]) > 2.5 && odd.over_od < 2)
                    && currentResultOdd && ((dangerAttacksKef2 > 1 && parseFloat(currentResultOdd.home_od) >= 1.2 && parseFloat(currentResultOdd.home_od) <= 4) || (dangerAttacksKef2 < 1 && parseFloat(currentResultOdd.away_od) >= 1.2 && parseFloat(currentResultOdd.away_od) <= 4))) {

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

                        //var averageGoalsFilterMain = (parseFloat(averageHomeGoals) + parseFloat(averageAwayGoals))/2;
                        //var averageGoalsFilter = (parseFloat(averageHomeGoals) + parseFloat(averageAwayGoals))/2 - parseInt(score.scores);

                        let message = 'Супер Бот\n';

                        message += '\u26BD ' + item.league.name + "\n";
                        message += '<b>' + item.home.name + ' ' + unicodeScores[goalsArray[0]] + '-' + unicodeScores[goalsArray[1]]  + ' ' + item.away.name + "</b> \u23F0 <i>" + item.timer.tm + "\'</i>\n";
                        if (resultOdds) {
                          message += "\n<pre>" + resultOdd.home_od + '-' + resultOdd.away_od + ' => ' + currentResultOdd.home_od + '-' + currentResultOdd.away_od;
                        }
                        message += '\nТБ - ' + odd.over_od + '/' + odd.handicap;

                        message += "\n" + 'ЗМ - ' + averageHomeGoals + '-' + averageAwayGoals;


                        if (view.stats) {
                          message += "\n\n" + 'Атаки: ' + view.stats.attacks[0] + '-' + view.stats.attacks[1];
                          message += "\n" + 'Опасные атаки: ' + view.stats.dangerous_attacks[0] + '-' + view.stats.dangerous_attacks[1];

                          message += "\n\n" + 'В створ: ' + view.stats.on_target[0] + '-' + view.stats.on_target[1];
                          message += "\n" + 'Мимо ворот: ' + view.stats.off_target[0] + '-' + view.stats.off_target[1];
                          message += "\n" + 'Угловые: ' + view.stats.corners[0] + '-' + view.stats.corners[1];
                          message += "\n" + 'Пенальти: ' + view.stats.penalties[0] + '-' + view.stats.penalties[1];
                          message += "\n" + 'Красные: ' + view.stats.redcards[0] + '-' + view.stats.redcards[1];
                          message += "\n" + 'Желтые: ' + view.stats.yellowcards[0] + '-' + view.stats.yellowcards[1];
                          if (view.stats.possession_rt) {
                            message += "\n" + 'Владение: ' + view.stats.possession_rt[0] + '-' + view.stats.possession_rt[1];
                          }

                          message += "</pre>"
                        }

                        message += "\n\n";
                        if (parseInt(view.stats.dangerous_attacks[0]) > parseInt(view.stats.dangerous_attacks[1])) {
                          message += "<b>Победа 1</b>";
                        } else  {
                          message += "<b>Победа 2</b>";
                        }


                        const ik = new InlineKeyboard();

                        ik.addRow(
                          { text: "\u26BD Счет", callback_data: item.id },
                          { text: "\u{1F30F} Подробно", url: "https://ru.betsapi.com/r/" + item.id + "/" + homeName + "-v-" + awayName }
                        );

                        let ikExport = ik.export();

                        let options = Object.assign({}, {parse_mode: 'HTML'}, ikExport);


                        showedEvents.push(item.id);
                        bot.sendMessage(testChannelId, message, options);

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
