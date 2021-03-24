const AWS = require("aws-sdk");
var https = require("https");
var util = require("util");
var qs = require("querystring");

const codePipeline = new AWS.CodePipeline();

async function getPipelines() {
  const data = await codePipeline.listPipelines().promise();
  let resp = {
    pipelines: data.pipelines.map(function (e) {
      return e.name;
    }),
    data: data,
  };

  return resp.pipelines;
}

async function getPipelineExecutionInfo(pipelineName) {
  const data = await codePipeline
    .listPipelineExecutions({ pipelineName: pipelineName })
    .promise();

  const pipelineExecutionSummaries = data.pipelineExecutionSummaries;
  console.log("# pipelineExecutionSummaries", pipelineExecutionSummaries);
  console.log("# data", data);

  let status =
    pipelineExecutionSummaries[0].status === "Succeeded"
      ? "Succeeded :white_check_mark:"
      : "Failed :x:";

  let lastUpdateTime = parseInt(
    new Date(pipelineExecutionSummaries[0].lastUpdateTime).getTime() / 1000
  ).toFixed(0);

  let result = {
    pipelineExecutionId: pipelineExecutionSummaries[0].pipelineExecutionId,
    name: pipelineName,
    lastUpdateTime: lastUpdateTime,
    status: status,
  };

  return result;
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

        console.log("#pipelineNames", pipelineNames);

        let pipelines = await Promise.all(
          pipelineNames.map((pipelineName) =>
            getPipelineExecutionInfo(pipelineName)
          )
        );

        console.log("#pipelines", pipelines);

        let formatBlock = pipelines.map((pipeline) => ({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Name:* ${pipeline.name} *Status*: ${pipeline.status}\n*Last Updated*: <!date^${pipeline.lastUpdateTime}^ {date_num} {time_secs}|Date Error>`,
          },
        }));

        var postData = {
          channel: "#final-year-project",
          username: "Velocity",
          response_type: "in_channel",
          text: parameter,
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
