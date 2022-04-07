import { prop, getModelForClass } from '@typegoose/typegoose';

class Auth {
  /* @prop() //mongoose
  email: string; //typescript */
  /* @prop()
  loginUserUsuario: string; */
  @prop({ required: false })
  token: string;
}

const AuthModel = getModelForClass(Auth, {
  schemaOptions: { collection: 'auths' },
});

export default AuthModel;
