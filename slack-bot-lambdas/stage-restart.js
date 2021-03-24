const AWS = require("aws-sdk");
var https = require("https");
var util = require("util");
var qs = require("querystring");

const codePipeline = new AWS.CodePipeline();

exports.handler = async function (event, context, callback) {
  try {
    var method = event.httpMethod;

    if (method === "POST") {
      if (event.path === "/") {
        callback(null, { statusCode: 200, body: "" });

        let eventBody = qs.parse(event.body);
        let parameters = eventBody.text.split(" ");
        const pipelineName = parameters[0];
        const stageName = parameters[1];

        let getPipelineStateParams = {
          name: pipelineName,
        };

        console.log("# getPipelineStateParams", getPipelineStateParams);

        const data = await codePipeline
          .getPipelineState(getPipelineStateParams)
          .promise();

        console.log("# data GETPIPELINESTATE", data);

        const pipelineExecutionId =
          data.stageStates[0].latestExecution.pipelineExecutionId;

        console.log("# pipelineExecutionId", pipelineExecutionId);

        let retryStageParams = {
          pipelineExecutionId: pipelineExecutionId,
          pipelineName: pipelineName,
          stageName: stageName,
          retryMode: "FAILED_ACTIONS",
        };

        console.log("# retryStageParams", retryStageParams);

        codePipeline
          .retryStageExecution(retryStageParams)
          .promise()
          .then((resp) => {
            var postData = {
              channel: "#final-year-project",
              username: "Velocity",
              response_type: "in_channel",
              text: `Successfully restarted ${pipelineName}'s ${stageName} stage`,
            };

            var options = {
              method: "POST",
              hostname: "hooks.slack.com",
              port: 443,
              path:
                "/services/T01G1B6T4P4/B01FLJYP90X/k3L1yDga7npDpBwcWmjXsVhe",
            };

            var req = https.request(options, function (res) {
              res.setEncoding("utf8");
              res.on("data", function (chunk) {
                context.done(null);
              });
            });

            req.on("error", function (e) {
              console.log("problem with request: " + e.message);
            });

            req.write(util.format("%j", postData));
            req.end();

            callback(null, resp);
          })
          .catch((err) => {
            console.warn("error", err);
            var postData = {
              channel: "#final-year-project",
              username: "Velocity",
              response_type: "in_channel",
              text: JSON.stringify(err.message),
            };

            var options = {
              method: "POST",
              hostname: "hooks.slack.com",
              port: 443,
              path:
                "/services/T01G1B6T4P4/B01FLJYP90X/k3L1yDga7npDpBwcWmjXsVhe",
            };

            var req = https.request(options, function (res) {
              res.setEncoding("utf8");
              res.on("data", function (chunk) {
                context.done(null);
              });
            });

            req.on("error", function (e) {
              console.log("problem with request: " + e.message);
            });

            req.write(util.format("%j", postData));
            req.end();

            callback(null, err);
          });

        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(pipelines),
        };
      }
    }

    // We only accept POST for now
    return {
      statusCode: 400,
      headers: {},
      body: "We only accept POST /",
    };
  } catch (error) {
    var body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      headers: {},
      body: JSON.stringify(body),
    };
  }
};
