import { prop, getModelForClass } from "@typegoose/typegoose";

export class CalendarInfo {
  @prop({ type: String })
  name: string;
  @prop({ type: String })
  calendarId: string;
  @prop({ type: String })
  channelId: string;
  @prop({ type: String })
  description: string;
  @prop({ type: String })
  dueDate: string;
  @prop({ type: Boolean })
  isActive: boolean;
}

class Calendar {
  @prop({ type: String })
  email: string;
  @prop({ type: String })
  loginUserUsuario: string;
  @prop({ type: Boolean })
  isActiveAll: boolean;
  @prop({ type: String })
  token: string;
  @prop({ type: [CalendarInfo] })
  calendarsInfo: CalendarInfo[];
}

const calendarModel = getModelForClass(Calendar, {
  schemaOptions: { collection: "calendars-gmail" },
});

export default calendarModel;
