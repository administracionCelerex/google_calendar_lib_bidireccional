import { mongoServer, mongoDbName } from "./constants/globals";

const fx = require("./src/index.js");

/* fx.createWatcher(uuid, webhook, calendarId, tokenGmail).then(() => {
  console.log('End Sub ');
}); */

fx.step1CalendarWorkFlow(mongoServer, mongoDbName).then(() => {
  console.log("End Step");
});
