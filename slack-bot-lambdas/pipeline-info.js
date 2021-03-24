const AWS = require("aws-sdk");
var https = require("https");
var util = require("util");
var qs = require("querystring");

const codePipeline = new AWS.CodePipeline();

async function getPipelines() {
  console.log("INSIDE getPipelines");

  const data = await codePipeline.listPipelines().promise();
  let resp = {
    pipelines: data.pipelines.map(function (e) {
      return e.name;
    }),
    data: data,
  };

  return resp.pipelines;
}

exports.handler = async function (event, context, callback) {
  try {
    var method = event.httpMethod;

    if (method === "POST") {
      if (event.path === "/") {
        callback(null, { statusCode: 200, body: "" });

        console.log("# EVENT", event.body);
        console.log("# CONTEXT", context);
        let eventBody = qs.parse(event.body);
        let parameter = eventBody.text;

        console.log("# parameter", parameter);

        const pipelineNames = await getPipelines();

        const pipelineName = pipelineNames.find(
          (pipelineName) => pipelineName === parameter
        );

        console.log("# pipelineName", pipelineName);

        let params = {
          name: String(pipelineName),
        };
        const data = await codePipeline.getPipelineState(params).promise();

        const stageStates = data.stageStates.map((stage) => {
          let status =
            stage.latestExecution.status === "Succeeded"
              ? "Succeeded :white_check_mark:"
              : "Failed :x:";
          return {
            stageName: stage.stageName,
            stageStatus: status,
            lastStatusChange: parseInt(
              new Date(
                stage.actionStates[0].latestExecution.lastStatusChange
              ).getTime() / 1000
            ).toFixed(0),
          };
        });

        let result = {
          pipelineName,
          stageStates,
        };

        let formatBlock = stageStates.map((stage) => ({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `\n*Stage Name:* ${stage.stageName} *Status*: ${stage.stageStatus}\n*Last Updated*: <!date^${stage.lastStatusChange}^{date_num} {time_secs}|Date Error>`,
          },
        }));

        formatBlock.unshift({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Pipeline Name:* ${pipelineName}`,
          },
        });

        var postData = {
          channel: "#final-year-project",
          username: "Velocity",
          response_type: "in_channel",
          text: pipelineName,
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
