import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { Topic } from "@aws-cdk/aws-sns";
import { CfnNotificationRule } from "@aws-cdk/aws-codestarnotifications";
import { LambdaSubscription } from "@aws-cdk/aws-sns-subscriptions";
import { Function, Runtime, Code } from "@aws-cdk/aws-lambda";
import * as path from "path";
import { Pipeline } from "@aws-cdk/aws-codepipeline";
import { EventField, RuleTargetInput } from "@aws-cdk/aws-events";
import { SnsTopic } from "@aws-cdk/aws-events-targets";

export interface PipelineEventProps {
  pipeline: Pipeline;
  topic: Topic;
}

export class PipelineEvent extends Construct {
  constructor(scope: Construct, id: string, props: PipelineEventProps) {
    super(scope, id);

    const eventPipeline = EventField.fromPath("$.detail.pipeline");
    const eventState = EventField.fromPath("$.detail.state");
    const eventFull = EventField.fromPath("$.detail");

    props.pipeline.onStateChange("OnPipelineStateChange", {
      target: new SnsTopic(props.topic, {
        message: RuleTargetInput.fromText(
          `Pipeline ${eventPipeline} changed state to ${eventState}, eventFull ${eventFull}`
        ),
      }),
    });

    const target: CfnNotificationRule.TargetProperty = {
      targetType: "SNS",
      targetAddress: props.topic.topicArn,
    };

    new CfnNotificationRule(this, "statusChangeNotificationRule", {
      detailType: "FULL",
      eventTypeIds: [
        "codepipeline-pipeline-action-execution-succeeded",
        "codepipeline-pipeline-action-execution-failed",
        "codepipeline-pipeline-stage-execution-started",
        "codepipeline-pipeline-pipeline-execution-started",
      ],
      name: "notificationRuleName",
      resource: props.pipeline.pipelineArn,
      targets: [target],
    });

    let fn = new Function(this, "SODemoFunction", {
      runtime: Runtime.NODEJS_10_X,
      handler: "slack-alert.handler",
      code: Code.fromAsset(path.join(__dirname, "functions")),
    });

    props.topic.addSubscription(new LambdaSubscription(fn));
  }
}
