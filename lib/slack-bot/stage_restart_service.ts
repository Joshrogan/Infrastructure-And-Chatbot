import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";

export class StageRestartService extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const handler = new lambda.Function(this, "StageRestartHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("slack-bot-lambdas"),
      handler: "stage-restart.handler",
    });

    const statement = new iam.PolicyStatement();
    statement.addResources(
      "arn:aws:logs:*:*:*",
      "arn:aws:codepipeline:eu-west-1:*"
    );
    statement.addActions(
      "codepipeline:ListPipelines",
      "codepipeline:StartPipelineExecution",
      "codepipeline:GetPipelineState",
      "codepipeline:RetryStageExecution"
    );

    handler.addToRolePolicy(statement);

    const api = new apigateway.RestApi(this, "tage-restart-api", {
      restApiName: "Stage Restart Service",
      description: "This service restarts a specific Stage.",
    });

    const stageRestartIntegration = new apigateway.LambdaIntegration(handler);

    api.root.addMethod("POST", stageRestartIntegration);
  }
}
