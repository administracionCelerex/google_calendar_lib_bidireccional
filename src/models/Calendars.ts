import { prop, getModelForClass } from "@typegoose/typegoose";

class CalendarInfo {
  @prop({ type: String })
  name: string;
  @prop({ type: String })
  resourceId: string;
  @prop({ type: String })
  idSubscription: string;
  @prop({ type: String })
  description: string;
  @prop({ type: String })
  dueDate: string;
  @prop({ type: Boolean })
  isActive: boolean;
}

class Calendar {
  @prop({ type: String })
  owner: string;
  @prop({ type: String })
  loginUserUsuario: string;
  @prop({ type: Boolean })
  isActive: boolean;
  @prop({ type: [CalendarInfo] })
  calendarsInfo: CalendarInfo[];
}

const calendarModel = getModelForClass(Calendar, {
  schemaOptions: { collection: "calendars-gmail" },
});

export default calendarModel;
