const axios = require("axios");
const querystring = require("querystring");
const tz = "Asia/Tokyo";
const moment = require("moment-timezone");
const { OFFICE_GRAPH_BASE_URL } = process.env;

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Prefer: `outlook.timezone="${tz}"`,
});

exports.getEventOffice = (options) => {
  const { timeStart, timeEnd, token, nextLink } = options;
  const paramQuery = {
    startDateTime: moment(timeStart).tz(tz).format("YYYY-MM-DDT[00:00:01]Z"),
    endDateTime: moment(timeEnd)
      .tz(tz)
      .add("365", "days")
      .format("YYYY-MM-DDT[00:00:00]Z"),

    $select: "id,subject,start,end,recurrence,type,seriesMasterId,isOrganizer",
    top: 1000,
    $filter: "isOrganizer eq true",
  };
  const query = querystring.stringify(paramQuery);
  return new Promise((resolve, reject) => {
    return axios
      .get(
        nextLink
          ? nextLink
          : `${OFFICE_GRAPH_BASE_URL}/me/calendar/calendarView?${query}`,
        {
          headers: getHeaders(token),
        }
      )
      .then((res) => {
        if (res.data["@odata.nextLink"]) {
          return getEventOffice({
            nextLink: res.data["@odata.nextLink"],
            token,
          }).then((events) => [events, ...res.data.value]);
        }
        return res.data.value;
      })
      .then((res2) => resolve(res2));
  });
};
