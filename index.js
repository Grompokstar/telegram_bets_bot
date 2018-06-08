process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const _ = require('lodash');
const token = '515855036:AAEY-jgjNUA8ZKu7DyiLhXqY71PVKj4nxK4';
const bot = new TelegramBot(token, {polling: true});

var https = require('https');

var answer = '';
var filteredAnswer = '';
var filteredResults = [];
var requestIds = [];
var oddsArray = [];
let counter = -1;
let counter2 = -1;
var oddsArrayKeys = []

callback = function(response) {
  console.log('запрос events')
  answer = '';
  filteredAnswer = '';
  requestIds = [];
  oddsArray = [];
  counter = -1;
  counter2 = -1;
  oddsArrayKeys = [];
  response.on('data', function (chunk) {
    answer += chunk;
  });

  response.on('end', function () {
    let results = JSON.parse(answer).results;

    filteredResults = _.filter(results, function(item) {
      let scores = parseInt(item.scores[2].home) + parseInt(item.scores[2].away);
      //return true;
      return (item.ss === '0-0' && item.timer.tm === 20) || (scores <= 2 && item.timer.tm === 60) ||
        (item.scores[2].home === item.scores[2].away && item.timer.tm === 86);
    });

    _.forEach(filteredResults, function(item) {
      https.request('https://api.betsapi.com/v1/event/view?token=8334-BCLtMmtKT698vk&event_id=' + item.id, callback2).end();
    })
  });
};

callback2 = function(response) {
  console.log('запрос view');
  let answer2 = '';
  response.on('data', function (chunk) {
    answer2 += chunk;
  });

  counter++;
  console.log(counter);
  //console.log(oddsArrayKeys);

  response.on('end', function () {

    let view = JSON.parse(answer2).results[0];

    _.forEach(filteredResults, function(item) {
      if (view.id === item.id) {
        item.view = view;
        console.log(item.view)
      }
    });

    _.forEach(filteredResults, function(item) {
      requestIds.push(item.id);
      https.request('https://api.betsapi.com/v1/event/odds?token=8334-BCLtMmtKT698vk&event_id=' + item.id + '&odds_market=3', callback3).end();
    });
  });
}

callback3 = function(response) {
  console.log('запрос odds');
  let answer3 = '';
  response.on('data', function (chunk) {
    answer3 += chunk;
  });

  counter2++;
  console.log(counter2);
  console.log(requestIds);

  response.on('end', function () {

    let jsonOdds = JSON.parse(answer3).results['1_3'];
    let odd = jsonOdds[jsonOdds.length - 1];

    if (odd.over_od <= 1.5) {
      _.forEach(filteredResults, function(event) {
        if (requestIds[counter2] === event.id) {
          let homeName = event.home.name.split(' ').join('-');
          let awayName = event.away.name.split(' ').join('-');

          let message = '';
          message += 'Лига: ' + event.league.name + "\n";
          message += '<b>' + event.home.name + ' ' + event.ss + ' ' + event.away.name + "</b>\n" + event.timer.tm + ' минута ';
          message += "<a href=\'https://ru.betsapi.com/r/" + event.id + "/" + homeName + "-v-" +  awayName + "\'>Подробно</a>\n";
          message += odd.over_od + '/' + odd.handicap;
          if (event.view.stats) {
            message += "\n\n" + 'Атаки: ' + event.view.stats.attacks[0] + '-' +  event.view.stats.attacks[1];
            message += "\n" + 'Опасные атаки: ' + event.view.stats.dangerous_attacks[0] + '-' +  event.view.stats.dangerous_attacks[1];
            message += "\n" + 'Удары в створ: ' + event.view.stats.on_target[0] + '-' +  event.view.stats.on_target[1];
            message += "\n" + 'Удары мимо ворот: ' + event.view.stats.off_target[0] + '-' +  event.view.stats.off_target[1];
            message += "\n" + 'Угловые: ' + event.view.stats.corners[0] + '-' +  event.view.stats.corners[1];
            message += "\n" + 'Пенальти: ' + event.view.stats.penalties[0] + '-' +  event.view.stats.penalties[1];
            message += "\n" + 'Красные: ' + event.view.stats.redcards[0] + '-' +  event.view.stats.redcards[1];
            message += "\n" + 'Желтые: ' + event.view.stats.yellowcards[0] + '-' +  event.view.stats.yellowcards[1];
            if (event.view.stats.ball_safe) {
              message += "\n" + 'Мяч вне атаки: ' + event.view.stats.ball_safe[0] + '-' + event.view.stats.ball_safe[1];
            }
          }

          bot.sendMessage('@roma_best_football_bets', message, { parse_mode: "HTML" });
        }
      })
    }


  });
};

https.request('https://api.betsapi.com/v2/events/inplay?sport_id=1&token=8334-BCLtMmtKT698vk', callback).end();

setInterval(function() {
  https.request('https://api.betsapi.com/v2/events/inplay?sport_id=1&token=8334-BCLtMmtKT698vk', callback).end();
}, 60000);
