require("dotenv").config();
const { getEventOffice } = require("./query_office");
const { getData, queryData } = require("./query_dynamo");
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
    if (userLists?.Items.length) {
      for (
        let i = 0, len = userLists?.Items.length, arr = userLists?.Items;
        i < len;
        i++
      ) {
        if (
          arr[i].garoon_access_token &&
          moment(arr[i].garoon_expires_on) > moment() &&
          arr[i].office_access_token &&
          moment(arr[i].office_expires_on) > moment()
        ) {
          await checkSyncOffice({
            office_access_token: arr[i].office_access_token,
          });
        }
      }
    }
  } catch (err) {
    throw err;
  }
};

const checkSyncOffice = async (options) => {
  const { office_access_token } = options;
  try {
    const events = await getEventOffice({
      timeStart: TIME_START,
      timeEnd: TIME_START,
      token: office_access_token,
    });
    const eventApp = await queryData({
      tableName: EVENT_APP_TABLE,
      keyConditionExpression: "#id = :id",
      ExpressionAttributeNames: { "#id": "officeEventId" },
      ExpressionAttributeValues: { ":id": events[0].id },
    });
    console.log("eventApp: ", eventApp);
    // const eventNotSync = events.filter((event) => {
    //   queryData({
    //     tableName: EVENT_APP_TABLE,
    //     keyConditionExpression: "#id=:id",
    //     ExpressionAttributeNames: { "#id": "id" },
    //     ExpressionAttributeValues: { ":id": event.id },
    //   });
    // });
  } catch (e) {
    throw e;
  }
};

main().then((res) => true);
