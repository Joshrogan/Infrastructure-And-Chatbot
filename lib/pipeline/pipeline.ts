import { BuildSpec, ComputeType, LinuxBuildImage, PipelineProject } from '@aws-cdk/aws-codebuild';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { CodeBuildAction, GitHubSourceAction, S3DeployAction } from '@aws-cdk/aws-codepipeline-actions';
import { Bucket } from '@aws-cdk/aws-s3';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CfnOutput, RemovalPolicy } from '@aws-cdk/core';
import {  websiteBucketArn } from '../config/pipelineConfig';

import {EventField, RuleTargetInput } from '@aws-cdk/aws-events';
import {Topic } from '@aws-cdk/aws-sns';
import {SnsTopic} from '@aws-cdk/aws-events-targets';
import { CfnNotificationRule } from '@aws-cdk/aws-codestarnotifications'
import {Function, Runtime, Code}  from '@aws-cdk/aws-lambda'
import { LambdaSubscription } from '@aws-cdk/aws-sns-subscriptions';
import * as path from 'path';





export class CodePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const websiteBucket = Bucket.fromBucketArn(this, 'reactWebsiteBucket', websiteBucketArn)

    const reactBuildProject = new PipelineProject(this, 'reactCodeBuild', {
        buildSpec: BuildSpec.fromSourceFilename('buildspec.yml'),
        environment: {
            buildImage: LinuxBuildImage.STANDARD_5_0,
            computeType: ComputeType.SMALL
        }
    })

    const artifactBucket = new Bucket(this, 'artifactBucket', {
        bucketName: 'velocity-pipeline-artifact-bucket',
        removalPolicy: RemovalPolicy.DESTROY
    })

    const sourceArtifact = new Artifact('reactRepoLatestMain')

    const buildArtifact = new Artifact('reactBuildOutputArtifact')


    const pipeline = new Pipeline(this, 'reactPipeline', {
        artifactBucket,
        pipelineName: 'reactClientPipeline',
        stages: [
            {
                stageName: 'SourceCode',
                actions: [
                    new GitHubSourceAction({
                        actionName: 'readLatestMasterCommit',
                        branch: 'main',
                        output: sourceArtifact,
                        oauthToken: SecretValue.secretsManager('github-token'),
                        owner: 'Joshrogan',
                        repo: 'react-client'
                    })
                ]
            },
            {
                stageName: 'Build',
                actions: [
                    new CodeBuildAction({
                        actionName: 'buildReactApp',
                        input: sourceArtifact,
                        outputs: [buildArtifact],
                        project: reactBuildProject
                    })
                ]
            },
            {
                stageName: 'Deploy',
                actions: [
                    new S3DeployAction({
                        actionName: 'DeployReactApp',
                        input: buildArtifact,
                        bucket: websiteBucket
                    })
                ]
            }
        ]
    })

    const topic = new Topic(this, 'MyTopic');

    const eventPipeline = EventField.fromPath('$.detail.pipeline');
    const eventState = EventField.fromPath('$.detail.state');

    pipeline.onStateChange('OnPipelineStateChange', {
        target: new SnsTopic(topic, {
          message: RuleTargetInput.fromText(`Pipeline ${eventPipeline} changed state to ${eventState}`),
        }),
      });

      const target: CfnNotificationRule.TargetProperty = {targetType: 'SNS', targetAddress: topic.topicArn}

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
  
            topic.addSubscription(new LambdaSubscription(fn))


    new CfnOutput(this, 'codePipelineArn', {
        value: pipeline.pipelineArn
    })
  }
}