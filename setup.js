#!/usr/bin/env node
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const axios = require('axios');
const fs = require('fs');

const askQuestions = () => {
  return new Promise(async (resolve, reject) => {
    let usernameAnswer = await inquirer.prompt([
      {
        type: 'input',
        message: 'What is your Github username?',
        name: 'GITHUB_USERNAME',
      },
    ]);
    let tokenAnswer = await inquirer.prompt([
      {
        type: 'input',
        message: 'Please enter your Github Personal Access Token',
        name: 'GITHUB_PERSONAL_ACCESS_TOKEN',
      },
    ]);
    let reposAnswer = await inquirer.prompt([
      {
        type: 'input',
        message: 'Enter the repo name',
        name: 'REPO',
      },
    ]);
    resolve([
      usernameAnswer.GITHUB_USERNAME,
      tokenAnswer.GITHUB_PERSONAL_ACCESS_TOKEN,
      reposAnswer.REPO,
    ]);
  });
};

const createFile = (username, token, repos) => {
  console.log('what is repos', repos);
  let file = {
    githubUsername: username,
    githubPersonalAccessToken: token,
    repos: [repos],
  };

  return new Promise((resolve, reject) => {
    fs.writeFile('./config.json', JSON.stringify(file), (err) => {
      if (err) {
        console.log('Error writing file', err);
        reject(err);
      } else {
        console.log('Successfully wrote file');
        resolve(file);
      }
    });
  });
};

const success = (filepath) => {
  console.log(chalk.white.bgGreen.bold(`Done! File created at ${filepath}`));
};

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync('Github 2 Gantt', {
        font: 'standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      })
    )
  );
};

const run = async () => {
  // show script introduction
  init();
  // ask questions
  // ask questions
  const answers = await askQuestions();
  const [GITHUB_USERNAME, GITHUB_PERSONAL_ACCESS_TOKEN, REPOS] = answers;
  console.log({ GITHUB_USERNAME, GITHUB_PERSONAL_ACCESS_TOKEN, REPOS });
  // create the file
  const filePath = createFile(
    GITHUB_USERNAME,
    GITHUB_PERSONAL_ACCESS_TOKEN,
    REPOS
  );
  // show success message
  success(filePath);
};

run();
