const axios = require("axios");
const _ = require("lodash");
const uriApi = "/api/v1/schedule/events";
const { AWS_API } = process.env;

const getEventGaroon = (options) => {
  return new Promise((resolve, reject) => {
    const { garoon_token, domain, timeStart } = options;
    let uri = `${domain}${uriApi}?limit=1000&rangeStart=${timeStart}T12%3A00%3A00%2B09%3A00`;
    axios
      .get(uri, {
        headers: { Authorization: `Bearer ${garoon_token}` },
      })
      .then((res) => {
        resolve(res.data.events);
      })
      .catch((err) => {
        return getEventByAWS({ garoon_token, domain, timeStart });
      })
      .then((res) => resolve(res));
  });
};

const getEventByAWS = (options) => {
  const { garoon_token, domain, timeStart } = options;
  return new Promise((resolve, reject) => {
    axios
      .get(
        `${AWS_API}?domain=${domain}&accessToken=${garoon_token}&timeStart=${timeStart}`
      )
      .then((res) => {
        resolve(res.data.events);
      });
  });
};

module.exports = { getEventGaroon };
