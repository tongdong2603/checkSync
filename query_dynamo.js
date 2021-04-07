const AWS = require("aws-sdk");
require("dotenv").config();
AWS.config.region = process.env.REGION || "ap-southeast-1";
const db = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true,
});

const getData = (options) => {
  const { tableName, key, projectionExpression } = options;
  return new Promise((resolve, reject) => {
    const paramsQuery = {
      TableName: tableName,
      Key: key,
      ProjectionExpression: projectionExpression
        ? projectionExpression.join(" ")
        : null,
    };

    db.get(paramsQuery, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
};

const queryData = (options) => {
  const {
    tableName,
    indexName,
    attributesToGet,
    keyConditionExpression,
    expressionAttributeNames,
    filterExpression,
    select,
    expressionAttributeValues,
  } = options;
  return new Promise((resolve, reject) => {
    const paramsQuery = {
      TableName: tableName,
      IndexName: indexName,
      AttributesToGet: attributesToGet ? attributesToGet.join(" ") : null,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      FilterExpression: filterExpression,
      Select: select,
    };
    db.query(paramsQuery, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data.Items);
    });
  });
};

module.exports = { getData, queryData };
