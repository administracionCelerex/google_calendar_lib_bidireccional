import { mongoServer, mongoDbName, WEBHOOK } from "./constants/globals";

const fx = require("./src/index.js");

/* fx.createWatcher(uuid, webhook, calendarId, tokenGmail).then(() => {
  console.log('End Sub ');
}); */

fx.step1CalendarWorkFlow(mongoServer, mongoDbName, WEBHOOK).then(() => {
  console.log("End Step");
});
