import axios from "axios";

import calendarInfoTable from "./models/Calendars";

const mongoose = require("mongoose");
const moment = require("moment");

export const step1CalendarWorkFlow = async (
  mongoSever: string,
  mongoDBName: string
) => {
  try {
    await mongoose.connect(`mongodb+srv://${mongoSever}/${mongoDBName}`);
    console.log("connected to the DB");
    const calendarsRecords = await calendarInfoTable.find();

    for (const calendarRecord of calendarsRecords) {
      const { email, token, loginUserUsuario, calendarsInfo } = calendarRecord;
      console.log(token);
      console.log(calendarsInfo);
      //Run subscriptions
    }
  } catch (err) {
    console.log(err);
  }
};

export const createWatcher = async (
  id: string,
  webhook: string,
  calendarName: string,
  token: string
) => {
  const watcherUri = `https://www.googleapis.com/calendar/v3/calendars/${calendarName}/events/watch`;
  const tomorrow = moment().add(1, "days").add(10, "minutes");

  const tommowUnix = tomorrow.valueOf();
  //console.log(tommowUnix);

  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  const data = {
    id, // Your channel ID. it should be created by your own
    type: "web_hook",
    address: webhook, // Your receiving URL.
    expiration: tommowUnix.toString(),
  };
  //console.log(data, watcherUri);
  try {
    const res = await axios.post(watcherUri, data, options);
    console.log(res);
  } catch (error) {
    //const error = Any err;
    /* console.log(err.response.data);
    console.log('Hubo un error'); */
    /* if (error instanceof AxiosError) {
      console.log(error.response.data);
    }

    else message = String(error); */
    console.log(error);
  }
};

export const renewWatcher = () => {};
