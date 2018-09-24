process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const { InlineKeyboard, ReplyKeyboard, ForceReply } = require('telegram-keyboard-wrapper');
const rp = require('request-promise');
const _ = require('lodash');
const bot_3_Token = '677143481:AAGkPTg3zUhGSe0cwP0dSFgk_ah8KS0q6aE';
const bot = new TelegramBot(bot_3_Token, {polling: true});
const bot3TestChannel = '@betbomb_bot3_test';
const mainTestChannel = '@betbomb_test_channel';
const zaryadPlusCommonChannel = '@betbomb_zaryad_common';


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

        if (query.message.text.indexOf('тайма') > 0) {
          let recommend = query.message.text.substr(query.message.text.indexOf('тайма') + 6, 1);
          if (parseInt(recommend) + 1 <= parseInt(viewReq.scores["1"].home) + parseInt(viewReq.scores["1"].away)) {
            editText += '\u2705'
          } else {
            editText += '\u274C'
          }
        }

        if (query.message.text.indexOf('матча') > 0) {
          let recommend = query.message.text.substr(query.message.text.indexOf('матча') + 6, 1);
          if (parseInt(recommend) + 1 <= parseInt(viewReq.scores["2"].home) + parseInt(viewReq.scores["2"].away)) {
            editText += '\u2705'
          } else {
            editText += '\u274C'
          }
        }


        editText += '\n\n<b>Итоговый счет: ' + scoresText + ' \u{1F3C1}</b>';

        if (editText.length > 200) {
          let homeName = viewReq.home.name ? viewReq.home.name.split(' ').join('-') : '';
          let awayName = viewReq.away.name ? viewReq.away.name.split(' ').join('-') : '';
          const ik = new InlineKeyboard();

          ik.addRow(
            { text: "\u{1F30F} Подробно", url: "https://ru.betsapi.com/r/" + viewReq.id + "/" + homeName + "-v-" + awayName }
          );

          let ikExport = ik.export();

          let options = Object.assign({}, {parse_mode: 'HTML', chat_id: query.message.chat.id, message_id: query.message.message_id}, ikExport);

          bot.editMessageText(editText, options);
        } else {
          bot.editMessageText(editText, {parse_mode: 'HTML', chat_id: query.message.chat.id, message_id: query.message.message_id});
        }

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
        totalScores.push({itemId: item.id, scores: parseInt(item.scores[2].home) + parseInt(item.scores[2].away)});

        let leagueNameFilter = ['50', '60', '70', '80', 'U18', 'U19', 'U20', 'U21'];

        if (item.timer) {
          return item.timer.tm === 20 && showedEvents.indexOf(item.id) === -1
            && item.league.name.indexOf(leagueNameFilter[0]) === -1
            && item.league.name.indexOf(leagueNameFilter[1]) === -1
            && item.league.name.indexOf(leagueNameFilter[2]) === -1
            && item.league.name.indexOf(leagueNameFilter[3]) === -1
            && item.league.name.indexOf(leagueNameFilter[4]) === -1
            && item.league.name.indexOf(leagueNameFilter[5]) === -1
            && item.league.name.indexOf(leagueNameFilter[6]) === -1
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
            let goalsOffTarget = parseInt(view.stats.off_target[0]) + parseInt(view.stats.off_target[1]);
            let allGoals = 0;
            allGoals = goalsOnTarget + goalsOffTarget;

            if (goalsOnTarget >= 3 && goalsOffTarget >= 1 && allGoals >= 5 && attacksSumm >= 32 && dangerAttacksSumm/attacksSumm >= 0.5 && dangerAttacksSumm/attacksSumm <= 0.8) {
              rp('https://api.betsapi.com/v1/event/odds?token=8334-BCLtMmtKT698vk&event_id=' + item.id + '&odds_market=1,3,6')
                .then(function (response3) {
                  console.log('запрос odds');
                  let jsonOdds = JSON.parse(response3).results['1_3'];
                  let resultOdds = JSON.parse(response3).results['1_1'];
                  let firstHalfOdds = JSON.parse(response3).results['1_6'];
                  let odd = jsonOdds[jsonOdds.length - 1];
                  let currentTotalOdd = jsonOdds[0];
                  let resultOdd;
                  let currentResultOdd;
                  let firstHalfOdd;
                  let dangerAttacksKef = parseInt(view.stats.dangerous_attacks[0])/parseInt(view.stats.dangerous_attacks[1]);

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

                  if (odd && (odd.over_od <= 1.45 || parseFloat(handicapArray[0]) === 3 && odd.over_od < 1.85
                    || parseFloat(odd.over_od) < 1.95 && parseFloat(handicapArray[0]) > 3)
                    && ((dangerAttacksKef > 1 && parseFloat(currentResultOdd.home_od) <= 1.7) || (dangerAttacksKef <= 1 && parseFloat(currentResultOdd.away_od) <= 1.7))) {


                    let homeName = item.home.name ? item.home.name.split(' ').join('-') : '';
                    let awayName = item.away.name ? item.away.name.split(' ').join('-') : '';

                    let goalsArray;

                    if (item.ss) {
                      goalsArray = item.ss.split('-');
                    }

                    //var averageGoalsFilterMain = (parseFloat(averageHomeGoals) + parseFloat(averageAwayGoals))/2;
                    //var averageGoalsFilter = (parseFloat(averageHomeGoals) + parseFloat(averageAwayGoals))/2 - parseInt(score.scores);

                    let message = 'Бот 3.2\n';

                    message += '\u26BD ' + item.league.name + "\n";
                    message += '<b>' + item.home.name + ' ' + unicodeScores[goalsArray[0]] + '-' + unicodeScores[goalsArray[1]]  + ' ' + item.away.name + "</b> \u23F0 <i>" + item.timer.tm + "\'</i>\n";
                    if (resultOdds) {
                      message += "\n<pre>" + resultOdd.home_od + '-' + resultOdd.away_od + ' => ' + currentResultOdd.home_od + '-' + currentResultOdd.away_od;
                    }
                    message += '\nТБ - ' + odd.over_od + '/' + odd.handicap;


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

                      if (firstHalfOdd) {
                        message += '\n\nTБ 1 тайм - ' + firstHalfOdd.over_od + '/' + firstHalfOdd.handicap;
                      }

                      message += "</pre>"
                    }

                    message += "\n\n";
                    if (item.timer.tm === 20) {
                      message += "<b>Тотал 1-го тайма " + score.scores + '.5 Б</b>';
                    } else if (item.timer.tm === 65) {
                      message += '(' + currentTotalOdd.over_od + '/' + currentTotalOdd.handicap + ')';
                      message += "<b>Тотал матча " + score.scores + '.5 Б</b>';
                    }


                    const ik = new InlineKeyboard();

                    ik.addRow(
                      { text: "\u26BD Счет", callback_data: item.id },
                      { text: "\u{1F30F} Подробно", url: "https://ru.betsapi.com/r/" + item.id + "/" + homeName + "-v-" + awayName }
                    );

                    let ikExport = ik.export();

                    let messageCommon = 'Бот 3.2\n';

                    messageCommon += item.league.name + "\n";
                    messageCommon += '<b>' + item.home.name + ' ' + unicodeScores[goalsArray[0]] + '-' + unicodeScores[goalsArray[1]]  + ' ' + item.away.name + "</b> \u23F0 <i>" + item.timer.tm + "\'</i>\n";

                    if (firstHalfOdd) {
                      messageCommon += '\n<pre>TБ 1 тайм - ' + firstHalfOdd.over_od + '/' + firstHalfOdd.handicap + '</pre>';
                    }

                    messageCommon += "\n\n<b>Тотал 1-го тайма " + score.scores + '.5 Б</b>';

                    const ik2 = new InlineKeyboard();

                    ik2.addRow(
                      { text: "\u26BD Счет", callback_data: item.id },
                    );

                    let ikExport2 = ik2.export();

                    let options = Object.assign({}, {parse_mode: 'HTML'}, ikExport);
                    let optionsCommon = Object.assign({}, {parse_mode: 'HTML'}, ikExport2);


                    showedEvents.push(item.id);
                    bot.sendMessage(bot3TestChannel, message, options);
                    bot.sendMessage(mainTestChannel, message, options);
                    bot.sendMessage(zaryadPlusCommonChannel, messageCommon, optionsCommon);
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