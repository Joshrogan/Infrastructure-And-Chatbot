import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";

export class PipelineInfoService extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const handler = new lambda.Function(this, "PipelineInfoHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("slack-bot-lambdas"),
      handler: "pipeline-info.handler",
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

    const api = new apigateway.RestApi(this, "pipeline-info-api", {
      restApiName: "Pipeline Info Service",
      description: "This service serves info about specific pipeline.",
    });

    const getPipelineInfoIntegration = new apigateway.LambdaIntegration(
      handler
    );

    api.root.addMethod("POST", getPipelineInfoIntegration);
  }
}
