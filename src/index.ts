import axios from "axios";
import crypto from "crypto";
import calendarInfoTable from "./models/Calendars";
import GenericHandlerErrorRes from "./interfaces/genericHandlerErroRes";

const mongoose = require("mongoose");
const moment = require("moment");

export const step1CalendarWorkFlow = async (
  mongoSever: string,
  mongoDBName: string,
  webhook: string
) => {
  try {
    await mongoose.connect(`mongodb+srv://${mongoSever}/${mongoDBName}`);
    console.log("connected to the DB");
    const arraySubsPromises = [];
    const calendarsRecords = await calendarInfoTable.find();

    for (const calendarRecord of calendarsRecords) {
      const { email, token, loginUserUsuario, calendarsInfo, isActiveAll } =
        calendarRecord;

      if (!isActiveAll) continue;
      //El usuario tiene la syncronizacion Activada
      for (const caledObj of calendarsInfo) {
        const { calendarId, isActive } = caledObj;
        if (!isActive) {
          continue;
        }
        //El usuario tien la sync activada para este calendario en Especifico
        const uuid = crypto.randomUUID();
        console.log(uuid);

        const subWatcher = createWatcher(uuid, webhook, calendarId, token).then(
          async (res) => {
            if (res.error.isError) {
              const errorSubscriptionMsg = res.error.errorMsg;
              console.log(
                "Eror al crear la subscription " + errorSubscriptionMsg
              );

              return;
            }

            caledObj.channelId = uuid;
            //console.log(caledObj);

            return calendarRecord;
            //await calendarRecord.save();
          }
        );
        arraySubsPromises.push(subWatcher);
      }
      console.log("Vamos por otro usuario");
      //Run subscriptions
    }

    const subInfoData = await Promise.allSettled(arraySubsPromises);
    console.log("All promises set");
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
  const response: GenericHandlerErrorRes = {
    response: "",
    error: { isError: false, errorMsg: "" },
  };
  const watcherUri = `https://www.googleapis.com/calendar/v3/calendars/${calendarName}/events/watch`;
  /* const tomorrow = moment().add(1, "days").add(10, "minutes"); */
  const tomorrow = moment().add(1, "minutes"); //for testing a subscription only for 5 minutes

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
    //console.log(res.data);

    response.response = "SUBCRIPTION MADE SUCCESSFULLY";
    return response;
  } catch (error: any) {
    //const error = Any err;
    /* console.log(err.response.data);
    console.log('Hubo un error'); */
    /* if (error instanceof AxiosError) {
      console.log(error.response.data);
    }

    else message = String(error); */
    const errMsg = error?.response?.data;
    console.log(errMsg);
    response.error.isError = true;
    response.error.errorMsg = errMsg;
    return response;
  }
};

export const renewWatcher = () => {};
