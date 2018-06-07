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
      return (item.ss === '0-0' && item.timer.tm === 20) || (scores <= 2 && item.timer.tm === 60);
    });
    _.forEach(filteredResults, function(item) {
      requestIds.push(item.id);
      https.request('https://api.betsapi.com/v1/event/odds?token=8334-BCLtMmtKT698vk&event_id=' + item.id + '&odds_market=3', callback2).end();
    })
  });
};

callback2 = function(response) {
  console.log('запрос odds');
  let answer2 = '';
  response.on('data', function (chunk) {
    answer2 += chunk;
  });

  counter++;
  console.log(counter);
  console.log(requestIds);

  response.on('end', function () {

    let jsonOdds = JSON.parse(answer2).results['1_3'];
    let odd = jsonOdds[jsonOdds.length - 1];
    oddsArray.push(odd);

    _.forEach(filteredResults, function(item) {
      if (requestIds[counter] === item.id) {
        oddsArrayKeys.push({eventId: item.id, odd: odd});
        https.request('https://api.betsapi.com/v1/event/view?token=8334-BCLtMmtKT698vk&event_id=' + item.id, callback3).end();
      }
    })
  });
};

callback3 = function(response) {
  console.log('запрос view');
  let answer3 = '';
  response.on('data', function (chunk) {
    answer3 += chunk;
  });

  counter2++;
  console.log(counter2);
  //console.log(oddsArrayKeys);

  response.on('end', function () {

    let view = JSON.parse(answer3).results[0];
    let event = _.find(filteredResults, function(event) {
      return event.id === view.id;
    });
    let odd = _.find(oddsArrayKeys, function(item) {
      return item.eventId === view.id;
    });

    let message = '';
    message += 'Лига: ' + event.league.name + "\n";
    message += event.home.name + ' ' + event.ss + ' ' + event.away.name + "\n" + event.timer.tm + ' минута' + "\n";
    message += odd.odd.over_od + '/' + odd.odd.handicap;
    if (view.stats) {
      message += "\n\n" + 'Атаки: ' + view.stats.attacks[0] + '-' +  view.stats.attacks[1];
      message += "\n" + 'Опасные атаки: ' + view.stats.dangerous_attacks[0] + '-' +  view.stats.dangerous_attacks[1];
      message += "\n" + 'Удары: ' + view.stats.off_target[0] + '-' +  view.stats.off_target[1];
      message += "\n" + 'Удары в створ: ' + view.stats.on_target[0] + '-' +  view.stats.on_target[1];
      message += "\n" + 'Угловые: ' + view.stats.corners[0] + '-' +  view.stats.corners[1];
      message += "\n" + 'Пенальти: ' + view.stats.penalties[0] + '-' +  view.stats.penalties[1];
      message += "\n" + 'Красные: ' + view.stats.redcards[0] + '-' +  view.stats.redcards[1];
      message += "\n" + 'Желтые: ' + view.stats.yellowcards[0] + '-' +  view.stats.yellowcards[1];
    }

    bot.sendMessage('@roma_best_football_bets', message);
  });
}

https.request('https://api.betsapi.com/v2/events/inplay?sport_id=1&token=8334-BCLtMmtKT698vk', callback).end();

setInterval(function() {
  https.request('https://api.betsapi.com/v2/events/inplay?sport_id=1&token=8334-BCLtMmtKT698vk', callback).end();
}, 60000);
