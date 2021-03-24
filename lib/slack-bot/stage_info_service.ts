import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";

export class StageInfoService extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const handler = new lambda.Function(this, "StageInfoHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("slack-bot-lambdas"),
      handler: "stage-info.handler",
    });

    const statement = new iam.PolicyStatement();
    statement.addResources(
      "arn:aws:logs:*:*:*",
      "arn:aws:codepipeline:eu-west-1:*"
    );
    statement.addActions(
      "codepipeline:ListPipelines",
      "codepipeline:GetPipelineState"
    );

    handler.addToRolePolicy(statement);

    const api = new apigateway.RestApi(this, "stage-info-api", {
      restApiName: "Stage Info Service",
      description: "This service serves info about a specific stage.",
    });

    const getStageInfoIntegration = new apigateway.LambdaIntegration(handler);

    api.root.addMethod("POST", getStageInfoIntegration);
  }
}
