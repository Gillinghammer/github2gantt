## Github 2 Gant
See your Github repo milestones in a Gantt chart. Set and change your milestone's dates to help your team planning.

![preview](https://user-images.githubusercontent.com/578328/79090141-83eae180-7cfd-11ea-97b2-4443d9ed473f.png)

### Setup
Clone this repo, `npm install` and then run `npm run setup`
You will need:
- Github username
- Github personal access token
- Repo name


### How to Use
After you run the setup a config.json file will be created and saved in the project root.
Run `npm start` and head over to localhost:3000/.

`/milestones/data.json` stores all of your milestone data and tracks your timeline updates. 
`./config.json` contains your Github personal accesstoken.
Make sure to add these files to your .gitignore file
