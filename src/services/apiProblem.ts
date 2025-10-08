import { ApiResponse } from "apisauce"

type ErrorData = {
  data: string
}

type ErrorKind =
  /**
   * Times up.
   */
  | { kind: "timeout"; temporary: true }
  /**
   * Cannot connect to the server for some reason.
   */
  | { kind: "cannot-connect"; temporary: true }
  /**
   * The server experienced a problem. Any 5xx error.
   */
  | { kind: "server" }
  /**
   * We're not allowed because we haven't identified ourself. This is 401.
   */
  | { kind: "unauthorized" }
  /**
   * We don't have access to perform that request. This is 403.
   */
  | { kind: "forbidden" }
  /**
   * Unable to find that resource.  This is a 404.
   */
  | { kind: "not-found" }
  /**
   * All other 4xx series errors.
   */
  | { kind: "rejected" }
  /**
   * Something truly unexpected happened. Most likely can try again. This is a catch all.
   */
  | { kind: "unknown"; temporary: true }
  /**
   * The data we received is not in the expected format.
   */
  | { kind: "bad-data" }

export type GeneralApiProblem = ErrorKind & ErrorData

/**
 * Attempts to get a common cause of problems from an api response.
 *
 * @param response The api response.
 */
export function getGeneralApiProblem(response: ApiResponse<any>): GeneralApiProblem | void {
  switch (response.problem) {
    case "CONNECTION_ERROR":
      return { kind: "cannot-connect", data: response.data, temporary: true }
    case "NETWORK_ERROR":
      return { kind: "cannot-connect", data: response.data, temporary: true }
    case "TIMEOUT_ERROR":
      return { kind: "timeout", data: response.data, temporary: true }
    case "SERVER_ERROR":
      return { kind: "server", data: response.data }
    case "UNKNOWN_ERROR":
      return { kind: "unknown", data: response.data, temporary: true }
    case "CLIENT_ERROR":
      switch (response.status) {
        case 401:
          return { kind: "unauthorized", data: response.data }
        case 403:
          return { kind: "forbidden", data: response.data }
        case 404:
          return { kind: "not-found", data: response.data }
        default:
          return { kind: "rejected", data: response.data }
      }
    case "CANCEL_ERROR":
      return null
  }

  return null
}
