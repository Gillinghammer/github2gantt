var express = require('express');
var router = express.Router();
const axios = require('axios');
const fs = require('fs');
const config = require('../config.json');

const ax = axios.create({
  baseURL: 'https://api.github.com/',
  timeout: 1000,
  withCredentials: true,
  auth: {
    username: config.githubUsername,
    password: config.githubPersonalAccessToken,
  },
});

function updateJson(file) {
  return new Promise((resolve, reject) => {
    fs.writeFile('./milestones/data.json', JSON.stringify(file), (err) => {
      if (err) {
        console.log('Error writing file', err);
        reject(err);
      } else {
        console.log('Successfully wrote file');
        resolve(file);
      }
    });
  });
}

async function getMilestones() {
  return new Promise(async (resolve, reject) => {
    try {
      let allMilestones = [];
      for (let i = 0; i < config.repos.length; i++) {
        // wait for the promise to resolve before advancing the for loop
        let response = await ax.get(
          `repos/mapbox/${config.repos[i]}/milestones`
        );
        allMilestones.push(response.data);
      }
      var merged = [].concat.apply([], allMilestones);
      resolve(merged);
    } catch (error) {
      reject(error);
    }
  });
}

async function getInitialData(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let milestones = await getMilestones();
      let data = await populateMissingDates(milestones, req);
      let update = await updateJson(data);
      resolve(update);
    } catch (err) {
      reject(err);
    }
  });
}

async function refreshMilestones() {
  return new Promise(async (resolve, reject) => {
    try {
      let refreshed = await getMilestones();
      console.log('REFRESHED ', refreshed);
      const data = fs.readFileSync('./milestones/data.json');
      let milestones = JSON.parse(data);
      let updated = milestones.map((m, index) => {
        m.open_issues = refreshed[index].open_issues;
        m.closed_issues = refreshed[index].closed_issues;
        return m;
      });
      let update = await updateJson(milestones);
      resolve(update);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

async function populateMissingDates(milestones, req) {
  let moment = req.app.locals.moment;

  return new Promise((resolve, reject) => {
    try {
      let updated = milestones.map((m) => {
        let due = !!m.due_on ? m.due_on : null;

        if (!m.due_on) {
          m.due_on = moment().add(60, 'days').format('YYYY-MM-DD');
        } else if (moment().diff(moment(m.due_on), 'days') > 0) {
          m.start_on = moment().subtract(
            moment().diff(moment(m.due_on), 'days') + 60,
            'days'
          );
        }

        let start = !!m.start_on ? m.start_on : null;

        if (!m.start_on) {
          m.start_on = moment().format('YYYY-MM-DD');
        }

        return m;
      });
      resolve(updated);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

/* RESET GANTT BY HITTING THIS ENDPOINT TO REDOWNLOAD AND SAVE MILESTONES */
router.get('/milestones', async function (req, res, next) {
  const data = fs.readFileSync('./milestones/data.json');
  const milestones = JSON.parse(data);
  res.json(milestones);
});

router.get('/', async function (req, res, next) {
  if (!fs.existsSync('./milestones/data.json')) {
    await getInitialData(req);
  }
  const data = fs.readFileSync('./milestones/data.json');
  const milestones = JSON.parse(data);
  res.render('index', { title: 'WWW Gantt', milestones });
});

router.post('/update/:milestoneId', async function (req, res, next) {
  console.log('UPDATING MILESTON DATES', req.body);
  const milestoneId = req.params.milestoneId;
  const data = fs.readFileSync('./milestones/data.json');
  const milestones = JSON.parse(data);
  milestones.forEach((m, i) => {
    if (m.id == milestoneId) {
      milestones[i].due_on = req.body.endDate;
      milestones[i].start_on = req.body.startDate;
      console.log('updating ', {
        milestoneId,
        end: milestones[i].due_on,
        start: milestones[i].start_on,
      });
    }
  });
  // write to file
  let updatedMilestones = await updateJson(milestones);
  res.json(updatedMilestones);
});

router.post('/refresh', async function (req, res, next) {
  try {
    let refreshed = await refreshMilestones();
    res.json(refreshed);
  } catch (err) {
    res.send(500);
  }
});

/* RESET GANTT BY HITTING THIS ENDPOINT TO REDOWNLOAD AND SAVE MILESTONES */
router.post('/reset-my-project', async function (req, res, next) {
  let update = await getInitialData(req);
  res.json(update);
});

module.exports = router;
