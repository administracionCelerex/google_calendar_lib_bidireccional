import axios from "axios";
import crypto from "crypto";
import calendarInfoTable from "./models/Calendars";
import GenericHandlerErrorRes from "./interfaces/genericHandlerErroRes";
import GoogleSubResponse from "./interfaces/googleSubcriptionResponse";
import auth from "./models/auth";
import { ZohoAwsForm } from "./interfaces/ZohoAwsForm";

import { calendar_v3, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { GaxiosResponse, GaxiosError } from "gaxios";
import { ZOHOAPIOBJECT } from "./interfaces/ZohoApiObject";

const mongoose = require("mongoose");
const moment = require("moment");

const MINDAYS = 7;
const MAXDAYS = 7;
const libraryVersion = "1.0.3";

export const step1CalendarWorkFlow = async (
  mongoSever: string,
  mongoDBName: string,
  webhook: string
) => {
  try {
    console.log(`LIBVERSION: ${libraryVersion}`)
    await mongoose.connect(`mongodb+srv://${mongoSever}/${mongoDBName}`);
    console.log("connected to the DB");
    const arrayPromisesWatcher = [];
    const arrayPromisesToSaveAllCalendarId = [];
    const calendarsRecords = await calendarInfoTable.find();
    console.log(calendarsRecords);

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
            const { expiration, resourceId } = res.response;

            const dateOfExpi = moment(+expiration);

            caledObj.channelId = uuid;
            caledObj.watchedResourceId = resourceId as string;
            caledObj.dueDate = dateOfExpi.format("MM/DD/YYYY HH:mm:ss");
            return;
          }
        );
        arrayPromisesWatcher.push(subWatcher);
      }
      const subInfoData = Promise.allSettled(arrayPromisesWatcher).then(
        async () => {
          await calendarRecord.save();
          console.log("Saved");
        }
      );
      arrayPromisesToSaveAllCalendarId.push(subInfoData);
      console.log("Vamos por otro usuario");
      //Run subscriptions
    }

    await Promise.allSettled(arrayPromisesToSaveAllCalendarId);
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
    response: {
      expiration: "",
      id: "",
      kind: "",
      resourceId: "",
      resourceUri: "",
    },
    error: { isError: false, errorMsg: "" },
  };
  const watcherUri = `https://www.googleapis.com/calendar/v3/calendars/${calendarName}/events/watch`;
  /* const tomorrow = moment().add(1, "days").add(10, "minutes"); */
  const tomorrow = moment().add(1, "days"); //for testing a subscription only for 5 minutes

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
    const res = await axios.post<GoogleSubResponse>(watcherUri, data, options);
    console.log(res.data);
    //console.log(res.data);

    response.response = res.data;
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

//GOOGLE SYNC TOKEN

export const authorize = async (
  calendarId: string | undefined,
  email: string,
  mongoSever: string,
  mongoDBName: string,
  zohoApiObj: ZOHOAPIOBJECT
) => {
  const oAuth2Client = new google.auth.OAuth2();

  try {
    await mongoose.connect(`mongodb+srv://${mongoSever}/${mongoDBName}`);

    const calendarRecord = await calendarInfoTable
      .findOne({ email })
      .select({ token: 1, calendarsInfo: 1 })
      .exec();
    console.log("connected to DB");

    //console.log(calendarRecord);

    if (!calendarRecord) {
      console.log("email does not exist ");
      return;
    }

    const { token, calendarsInfo } = calendarRecord;
    const calendarUpdatedIndex = calendarsInfo.findIndex(
      (caleInf) => caleInf.calendarId === calendarId
    );
    if (calendarUpdatedIndex == -1) {
      return;
    }
    const { syncToken } = calendarRecord.calendarsInfo[calendarUpdatedIndex];
    const credentials = { access_token: token };
    // Check if we have previously stored a token.

    oAuth2Client.setCredentials(credentials);

    const eventsGmail = await run(
      oAuth2Client,
      calendarId,
      syncToken,
      email,
      zohoApiObj
    );
    const newSyncToken = eventsGmail?.nextSyncToken;
    console.log(newSyncToken);
    calendarsInfo[calendarUpdatedIndex].syncToken = newSyncToken
      ? newSyncToken.toString()
      : "null";

    await calendarRecord.save();
    console.log("saved");
  } catch (error) {
    console.log(error);
  }
};

//Google Callback

const googleListEventsCallback = async (
  res: GaxiosResponse<calendar_v3.Schema$Events> | null | undefined,
  calendarId: string | undefined,
  email: string,
  zohoApiObj: ZOHOAPIOBJECT
) => {
  let events: calendar_v3.Schema$Events | undefined;
  events = res?.data;
  const items = events?.items;
  if (items?.length) {
    console.log(`Upcoming ${items.length} events:`);
    //res?.data.
    await sendToZoho(items, email, calendarId, zohoApiObj);
  } else {
    console.log("No new events to sync.");
  }

  return events;
};

//RUN

const run = async (
  auth: OAuth2Client,
  calendarId: string | undefined,
  syncTokenOld: string | null,
  email: string,
  zohoApiObj: ZOHOAPIOBJECT
) => {
  const calendar = google.calendar({ version: "v3", auth });
  const timeMin = moment().subtract(MINDAYS, "days").toDate().toISOString();
  const timeMax = moment().add(MAXDAYS, "days").toDate().toISOString();
  //console.log(timeMin);
  let requestParams = {};
  // Load the sync token stored from the last execution, if any.
  const syncToken =
    syncTokenOld?.trim() == ("" || "null") ? null : syncTokenOld?.trim();
  console.log("sync " + syncToken);
  if (syncToken == null || syncToken == "") {
    console.log("Performing full sync.");

    // Set the filters you want to use during the full sync. Sync tokens aren't compatible with
    // most filters, but you may want to limit your full sync to only a certain date range.
    // In this example we are only syncing events up to a year old.

    requestParams = { ...requestParams, ...{ timeMin, timeMax } };
  } else {
    console.log("Performing incremental sync.");
    requestParams = { ...requestParams, ...{ syncToken } };
  }

  // Retrieve the events, one page at a time.
  let pageToken = null;
  let counter = -1;
  let events: calendar_v3.Schema$Events | undefined;
  do {
    requestParams = { ...requestParams, ...{ pageToken } };
    counter++;

    const eventsPromise: calendar_v3.Schema$Events | undefined =
      await new Promise((resolve, reject) => {
        try {
          calendar.events.list(
            {
              calendarId,
              maxResults: 10,
              ...requestParams,
            },
            async (err, res) => {
              if (err) {
                const errorGa = err as GaxiosError;
                const statusCode = errorGa.code;
                const messageErororGaxios = errorGa.message;
                if (statusCode == "410") {
                  console.log(messageErororGaxios);
                  events = await run(auth, calendarId, null, email, zohoApiObj);
                  resolve(events);
                }
                //manage error of Auth tokern

                if (statusCode == "401") {
                  console.log("Auth token invalid");
                  resolve(events);
                  return;
                }
              } else {
                events = await googleListEventsCallback(
                  res,
                  calendarId,
                  email,
                  zohoApiObj
                );
                //console.log(events);
                pageToken = events?.nextPageToken;
                resolve(events);
                //console.log(`Counter: ${counter}`);
                /* if (!err) {
                resolve(events);
              } */
              }
            }
          );
        } catch (e) {}
      });
    console.log(pageToken);
    events = eventsPromise;
    //console.log("Events");
  } while (pageToken != null);
  console.log("end while");

  //console.log(events);

  //const newSynToken = events?.nextSyncToken;
  //console.log(` new sync token ${newSynToken}`);

  return events;
};

const sendToZoho = async (
  items: calendar_v3.Schema$Event[] | undefined,
  email: string,
  calendarId: string | undefined,
  zohoApiObj: ZOHOAPIOBJECT
) => {
  console.log("Send to zoho ");
  if (!items) {
    return;
  }

  //call the api of zoho

  const totalRecors = items.length;
  const records: ZohoAwsForm[] = items.map((item) => {
    console.log(item);

    return {
      affectedtype: "CALENDAR",
      accion: "UPDATE",
      externalid: calendarId,
      owner: email,
      serviceProvider: "GMAIL",
      helpInfo: `Evento "${item.summary}" fue CREADO/ACTUALIZADO`,
      data: JSON.stringify(item),
      dataOutlook: "",
      hasBeenUsed: "false",
      status: "",
    };
  });

  let returnValue = {
    isError: true, //cambiar a true
    msg: "Fail to Send the info the CRM",
  };

  const { baseUrl, owner, appLinkName, awsForm } = zohoApiObj;
  const uri = `https://${baseUrl}/api/v2/${owner}/${appLinkName}/form/${awsForm}`;

  try {
    const objAuthZohoArray = await auth.find({ type: "zoho" });
    if (objAuthZohoArray.length < 1) {
      console.log("Obj Not Found");
      return;
    }
    const objAuthZoho = objAuthZohoArray[0];

    const token = objAuthZoho.token;

    const limitRecords = 200;

    const exMath = Math.floor((totalRecors - 1) / limitRecords);
    const maxItera = exMath + 1;
    for (let i = 0; i < maxItera; i++) {
      const startArray = i * limitRecords;
      const endArray = startArray + limitRecords;
      const dataPart = records.slice(startArray, endArray);

      const data = {
        data: dataPart,
      };

      const response = await axios.post(uri, data, {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      });
    }

    returnValue.isError = false;
    returnValue.msg = "Data was Sent Correctly";
    console.log("Send CRM");
    return returnValue;
  } catch (err) {
    console.log(err);
    return returnValue;
  }
};
