const axios = require("axios");
const querystring = require("querystring");
const tz = "Asia/Tokyo";
const moment = require("moment-timezone");
const { OFFICE_GRAPH_BASE_URL } = process.env;

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const getEventGoogle = (options) => {
  const { timeStart, timeEnd, token, nextPageToken } = options;
  const googleCalendarId = options.googleCalendarId || "primary";
  const conditions = {
    timeMin: moment(timeStart).tz(tz).format("YYYY-MM-DDT[00:00:00]Z"),
    timeMax: moment().add(365, "days").tz(tz).format("YYYY-MM-DDT[00:00:00]Z"),
    maxResults: 2500,
    timeZone: tz,
  };
  nextPageToken && (conditions.pageToken = nextPageToken);
  const query = querystring.stringify(conditions);
  const uri = `${GOOGLE_API_URL}/calendar/v3/calendars/${googleCalendarId}/events?${query}`;
  return new Promise((resolve, reject) => {
    return axios
      .get(uri, {
        headers: getHeaders(token),
      })
      .then((res) => {
        if (res.data["nextPageToken"]) {
          return getEventGoogle({ ...options, pageToken: body.nextPageToken });
        }
      });
  });
};

module.exports = { getEventGoogle };
