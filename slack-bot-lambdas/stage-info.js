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

        console.log("# EVENT", event.body);
        console.log("# CONTEXT", context);
        let eventBody = qs.parse(event.body);
        let parameters = eventBody.text.split(" ");

        console.log("# parameter", parameters);
        console.log("# parameter 0", parameters[0]);

        const pipelineName = parameters[0];
        const stageName = parameters[1];

        console.log("# pipelineName", pipelineName);
        console.log("# stageName", stageName);

        let params = {
          name: String(pipelineName),
        };
        const data = await codePipeline.getPipelineState(params).promise();

        const stageStates = data.stageStates.map((stage) => {
          return {
            stageName: stage.stageName,
            stageStatus: stage.latestExecution.status,
            lastStatusChange: parseInt(
              new Date(
                stage.actionStates[0].latestExecution.lastStatusChange
              ).getTime() / 1000
            ).toFixed(0),
          };
        });

        const selectedStage = stageStates.filter(
          (stage) => stage.stageName === stageName
        );

        console.log("# stageStates", stageStates);

        console.log("#selectedStage", selectedStage);

        let formatBlock = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `No matching stage found`,
            },
          },
        ];
        if (selectedStage.length === 1) {
          formatBlock = selectedStage.map((stage) => ({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `\n*Stage Name:* ${stage.stageName} *Status*: ${stage.stageStatus}\n*Last Updated*: <!date^${stage.lastStatusChange}^{date_num} {time_secs}|Date Error>`,
            },
          }));
        }

        var postData = {
          channel: "#final-year-project",
          username: "Velocity",
          response_type: "in_channel",
          blocks: formatBlock,
        };

        var options = {
          method: "POST",
          hostname: "hooks.slack.com",
          port: 443,
          path: "/services/T01G1B6T4P4/B01FLJYP90X/k3L1yDga7npDpBwcWmjXsVhe",
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

        callback(null, response);

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
