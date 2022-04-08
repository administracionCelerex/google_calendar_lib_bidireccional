import GoogleSubResponse from "./googleSubcriptionResponse";

interface GenericHandlerErrorRes {
  response: GoogleSubResponse;
  error: {
    isError: boolean;
    errorMsg: string;
  };
}

export default GenericHandlerErrorRes;
