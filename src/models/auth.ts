import { prop, getModelForClass } from "@typegoose/typegoose";

class Auth {
  /* @prop() //mongoose
  email: string; //typescript */
  /* @prop()
  loginUserUsuario: string; */
  @prop({ required: false, type: String })
  token: string;
  @prop({ type: String })
  email: string;
}

const AuthModel = getModelForClass(Auth, {
  schemaOptions: { collection: "auths" },
});

export default AuthModel;
