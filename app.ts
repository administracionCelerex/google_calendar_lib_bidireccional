import { mongoServer, mongoDbName, WEBHOOK } from "./constants/globals";

//const fx = require("./src/index.js");
import { authorize } from "./src/index";

/* fx.createWatcher(uuid, webhook, calendarId, tokenGmail).then(() => {
  console.log('End Sub ');
}); */

/* fx.step1CalendarWorkFlow(mongoServer, mongoDbName, WEBHOOK).then(() => {
  console.log("End Step");
}); */

authorize(
  "rhk1omkoa07v0p6m69n66mhn0c@group.calendar.google.com",
  "pruebasdevcelerex@gmail.com",
  mongoServer,
  mongoDbName
).then((res) => {
  console.log("End Authorize");
});
