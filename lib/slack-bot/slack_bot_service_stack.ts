import * as cdk from "@aws-cdk/core";
import * as pipeline_service from "./pipeline_service";

export class SlackBotServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new pipeline_service.PipelineService(this, "Pipelines");
  }
}
