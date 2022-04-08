interface GenericHandlerErrorRes {
  response: string;
  error: {
    isError: boolean;
    errorMsg: string;
  };
}

export default GenericHandlerErrorRes;
