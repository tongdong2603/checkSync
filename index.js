require("dotenv").config();
const { getEventOffice } = require("./query_office");
const { getData, queryData } = require("./query_dynamo");
const { getEventGaroon } = require("./query_garoon");
const { getEventGoogle } = require("./query_google");
const moment = require("moment-timezone");
const {
  TIME_START,
  TIME_END,
  SETTING_TABLE,
  USER_TABLE,
  DOMAIN,
  EVENT_APP_TABLE,
} = process.env;

const main = async () => {
  try {
    const info = {};
    const config = await getData({
      tableName: SETTING_TABLE,
      key: { domain: DOMAIN },
    });
    if (config?.Item) {
      info.sync = config.Item.selectSync;
      info.oneWay = config.Item.selectOneWaySync;
    }
    const userLists = await queryData({
      tableName: USER_TABLE,
      keyConditionExpression: "#dm = :dm",
      expressionAttributeNames: {
        "#dm": "domain",
      },
      expressionAttributeValues: {
        ":dm": DOMAIN,
      },
    });
    if (userLists?.length) {
      for (let i = 0, len = userLists?.length, arr = userLists; i < len; i++) {
        if (
          arr[i].garoon_access_token &&
          moment(arr[i].garoon_expires_on) > moment() &&
          arr[i].office_access_token &&
          moment(arr[i].office_expires_on) > moment()
        ) {
          const eventInDb = await queryData({
            tableName: EVENT_APP_TABLE,
            indexName: "domain-officeCode-index",
            keyConditionExpression: "#dm = :dm and officeCode = :officeCode",
            expressionAttributeNames: { "#dm": "domain" },
            expressionAttributeValues: {
              ":dm": DOMAIN,
              ":officeCode": arr[i].officeCode,
            },
          });

          const eventNotSync = await checkSyncOffice({
            office_access_token: arr[i].office_access_token,
            eventInDb,
          });
          info[arr[i].officeCode] = { office: JSON.stringify(eventNotSync) };
          const eventGaroonNotSync = await checkSyncGaroon({
            garoon_token: arr[i].garoon_access_token,
            eventInDb,
          });

          info[arr[i].officeCode] = {
            ...info[arr[i].officeCode],
            garoon: JSON.stringify(eventGaroonNotSync),
          };
        }
      }
    }
    console.log("info: ", info);
  } catch (err) {
    throw err;
  }
};

const checkSyncOffice = async (options) => {
  const { office_access_token, eventInDb } = options;
  try {
    const events = await getEventOffice({
      timeStart: TIME_START,
      timeEnd: TIME_START,
      token: office_access_token,
    });

    const eventNotSync = events.filter(
      (event) =>
        !eventInDb.some((eventDb) => eventDb.officeEventId === event.id)
    );
    return eventNotSync;
  } catch (e) {
    throw e;
  }
};

const checkSyncGaroon = async (options) => {
  const { garoon_token, eventInDb } = options;
  try {
    const eventInGaroon = await getEventGaroon({
      garoon_token,
      domain: DOMAIN,
      timeStart: TIME_START,
    });
    const eventNotSync = eventInGaroon.filter((event) => {
      !eventInDb.some((eventDb) => eventDb.officeEventId === event.id);
    });

    return eventNotSync;
  } catch (e) {
    throw e;
  }
};

main().then((res) => true);
