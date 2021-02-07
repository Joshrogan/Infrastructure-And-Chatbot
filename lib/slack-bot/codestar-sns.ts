import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { Topic } from '@aws-cdk/aws-sns';
import { CfnNotificationRule } from '@aws-cdk/aws-codestarnotifications'
import { LambdaSubscription } from '@aws-cdk/aws-sns-subscriptions';
import {Function, Runtime, Code}  from '@aws-cdk/aws-lambda'
import * as path from 'path';
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources';



export class CodeStarSns extends Stack {
    public readonly topic: Topic

    constructor(scope: Construct, id: string, props: StackProps) {
      super(scope, id,);
        
      const testTopic = new  Topic(this, 'pipelineTopic')

      const target: CfnNotificationRule.TargetProperty = {targetType: 'SNS', targetAddress: testTopic.topicArn}

    new CfnNotificationRule(this, 'statusChangeNotificationRule', {
        detailType: 'FULL',
        eventTypeIds: [
            "codepipeline-pipeline-action-execution-succeeded",
            "codepipeline-pipeline-action-execution-failed",
            'codepipeline-pipeline-stage-execution-started',
            'codepipeline-pipeline-pipeline-execution-started'
           ],
           name:'notificationRuleName',
           resource: 'arn:aws:codepipeline:eu-west-1:509079033231:reactClientPipeline',
           targets: [target]
        })


        let fn = new Function(this, 'SODemoFunction', {
            runtime: Runtime.NODEJS_10_X,
            handler: 'slack-alert.handler',
            code: Code.fromAsset(path.join(__dirname, 'functions'))
          });

        testTopic.addSubscription(new LambdaSubscription(fn))

        // fn.addEventSource(new SnsEventSource(testTopic))
        

    }
}