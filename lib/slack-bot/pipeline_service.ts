import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";

export class PipelineService extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const handler = new lambda.Function(this, "PipelineHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("slack-bot-lambdas"),
      handler: "pipelines.handler",
    });

    const statement = new iam.PolicyStatement();
    statement.addResources(
      "arn:aws:logs:*:*:*",
      "arn:aws:codepipeline:eu-west-1:*"
    );
    statement.addActions(
      "codepipeline:ListPipelines",
      "codepipeline:ListPipelineExecutions"
    );

    handler.addToRolePolicy(statement);

    const api = new apigateway.RestApi(this, "pipelines-api", {
      restApiName: "Pipeline Service",
      description: "This service serves lists pipelines and their status.",
    });

    const getPipelinesIntegration = new apigateway.LambdaIntegration(handler);

    api.root.addMethod("POST", getPipelinesIntegration);
  }
}
