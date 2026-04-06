# CloudWave Full Stack Code Challenge ~ Wave Chat
CloudWave have provided scaffolding for both the front and back end of the challenge, to save you time.

### Start instructions
git clone https://github.com/ajay1133/wave-chat.git

## Start Backend Nodejs Server (Port 3001)
Served locally at http://localhost:3001. Open terminal & enter below commands. Port can be edited in `/backend/config.ts`.

cd backend  
npm install  
npm start

The standard would have been to use a database but focus was to develop chat application so used default hardcoded list of users `default-users.json` & RAM to persist data related to user actions which wipes out on server refresh. 

## Start Frontend React/Vite Server (Port 5173)
Served locally at http://localhost:5173. Open terminal & enter below commands.

cd frontend  
npm install  
npm start

User by default lands on login screen. There are 5 test users 
mentioned in `/server/default-users.json` that can be used to login.

## Front-end

### Configuration
This application uses Vite, ReactJS, Typescript and vitest for testing. `tsconfig.json` has been pre-configured for the environment and hot reloading has been set up for you.

&nbsp;
### Linting & Prettier
There's `stylelint` for linting SCSS files and `eslint` for linting code. You can lint the application with the `lint` and `lint:styles` commands in `package.json`.

Prettier is setup with configuration in `server/.prettierrc`

&nbsp;
### UI & Components
Used simple CSS because of time restrictions

&nbsp;
### Routing
This challenge uses `react-router` for routing.

&nbsp;
### Socket IO
Read more [here](https://socket.io/). The examples on the home page should be enough for you to complete the challenge.

&nbsp;
## Back-end

### Configuration
This application uses typescript and jest. `tsconfig.json` has been pre-configured for the environment.

&nbsp;
### Socket IO
The HTTP server with socket.io are already connected. The socket server will automatically run by default on port 3001.

&nbsp;
### Hot Reload
The backend server supports hot reload using `nodemon`. Any changes you make to files will automatically be updated if the server is started with the `start:dev` command.
