import * as cdk from "@aws-cdk/core";
import * as pipeline_service from "./pipeline_service";
import * as pipeline_info_service from "./pipeline_info_service";
import * as pipeline_restart_service from "./pipeline_restart_service";

export class SlackBotServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new pipeline_service.PipelineService(this, "PipelineService");
    new pipeline_info_service.PipelineInfoService(this, "PipelineInfoService");
    new pipeline_restart_service.PipelineRestartService(
      this,
      "PipelineRestartService"
    );
  }
}
