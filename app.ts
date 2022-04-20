import {
  mongoServer,
  mongoDbName,
  WEBHOOK,
  ZOHOOBJECT,
} from "./constants/globals";

//const fx = require("./src/index.js");
import { authorize, step1CalendarWorkFlow } from "./src/index";

/* fx.createWatcher(uuid, webhook, calendarId, tokenGmail).then(() => {
  console.log('End Sub ');
}); */

step1CalendarWorkFlow(mongoServer, mongoDbName, WEBHOOK).then(() => {
  console.log("End Step");
});

/* authorize(
  "rhk1omkoa07v0p6m69n66mhn0c@group.calendar.google.com",
  "pruebasdevcelerex@gmail.com",
  mongoServer,
  mongoDbName,
  ZOHOOBJECT
).then((res) => {
  console.log("End Authorize");
}); */
