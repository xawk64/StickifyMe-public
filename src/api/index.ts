import { saveAs } from "file-saver";
import { IServerMessageResponse } from "./models/ServerMessageResponseType";

const defaultLocation: string =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export enum LocalStorageKeysEnum {
  TOKEN = "accessToken",
}

export const storageToken = () => {
  return localStorage.getItem(LocalStorageKeysEnum.TOKEN);
};

const buildParamsPost = (met: string, data?: any) => {
  if (data) {
    const headers = data.headers;

    return {
      method: met,
      headers:
        headers === null
          ? { "x-access-token": String(storageToken()) }
          : {
              "Content-Type": "application/json",
              "x-access-token": String(storageToken()),
              ...headers,
            },
      body:
        headers === null
          ? data.body
          : JSON.stringify(data.headers ? data.body : data),
    };
  }
  return {
    method: met,
    headers: {
      "Content-Type": "application/json",
      "x-access-token": String(storageToken()),
    },
  };
};

const buildParams = (met: string, data?: any) => ({
  method: met,
  headers: { "x-access-token": String(storageToken()) },
  body: JSON.stringify(data),
});

const handleResponse = async (res: any) => {
  localStorage.setItem("status", res.status);
  const status = String(res.status).substring(0, 1);
  if (status === "2") {
    return (await res.json()) as Promise<any>;
  } else {
    return Promise.reject(res);
  }
};

export async function downloadFile(response: any, print: boolean) {
  localStorage.setItem("status", response.status);
  const status = String(response.status).substring(0, 1);
  if (status === "2") {
    const blob = await response.blob();

    // Download the file
    if (print) {
      return blob;
    } else {
      saveAs(blob, "stickers.pdf");
    }
  } else {
    return Promise.reject(response);
  }
}

const handleError = async (res: any) => {
  console.log(res);
  const data: IServerMessageResponse = await res.json();
  const status = String(res.status).substring(0, 1);
  if (res.status === 401) {
    // localStorage.clear();
  } else if (res.status === 403) {
    console.log("/error/403");
  } else if (res.status === 404) {
    console.log("/error/404");
  } else if (res.status === 503) {
    console.log("/error/503");
  } else if (status === "5") {
    console.log("/error/500");
  }
  throw data;
};

export const post = (
  url: string,
  data?: any,
  location: string = defaultLocation
) =>
  fetch(location + url, buildParamsPost("POST", data))
    .then(handleResponse)
    .catch(handleError);
export const get = (url: string, location: string = defaultLocation) =>
  fetch(location + url, buildParams("GET"))
    .then(handleResponse)
    .catch(handleError);
export const download = <T>(url: string, data?: T, print = false) =>
  fetch(defaultLocation + url, buildParamsPost("POST", data)).then(
    (response) => {
      return downloadFile(response, print);
    }
  );
