import {
  BuildSpec,
  ComputeType,
  LinuxBuildImage,
  PipelineProject,
} from "@aws-cdk/aws-codebuild";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import {
  CodeBuildAction,
  GitHubSourceAction,
  S3DeployAction,
  ManualApprovalAction,
} from "@aws-cdk/aws-codepipeline-actions";
import { Bucket } from "@aws-cdk/aws-s3";
import { Construct, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import { CfnOutput, RemovalPolicy } from "@aws-cdk/core";
import { websiteBucketArn } from "../config/pipelineConfig";
import {
  SLACK_BOT_TOKEN,
  SLACK_CHANNEL_NAME,
  SLACK_SIGNING_SECRET,
} from "../config/slackConfig";
import { Topic } from "@aws-cdk/aws-sns";
import { PipelineEvent } from "./pipeline-event";
import {
  SlackApprovalAction,
  SlackNotifier,
} from "@cloudcomponents/cdk-codepipeline-slack";

export class CodePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const websiteBucket = Bucket.fromBucketArn(
      this,
      "reactWebsiteBucket",
      websiteBucketArn
    );

    const reactBuildProject = new PipelineProject(this, "reactCodeBuild", {
      buildSpec: BuildSpec.fromSourceFilename("buildspec.yml"),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,
        computeType: ComputeType.SMALL,
      },
    });

    const artifactBucket = new Bucket(this, "artifactBucket", {
      bucketName: "velocity-pipeline-artifact-bucket",
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const sourceArtifact = new Artifact("reactRepoLatestMain");

    const buildArtifact = new Artifact("reactBuildOutputArtifact");

    const slackBotToken = SLACK_BOT_TOKEN;
    const slackSigningSecret = SLACK_SIGNING_SECRET;
    const slackChannel = SLACK_CHANNEL_NAME;

    console.log("slackSigningSecret", slackSigningSecret);

    const approvalAction = new SlackApprovalAction({
      actionName: "SlackApproval",
      slackBotToken,
      slackSigningSecret,
      slackChannel,
      slackBotName: "Velocity",
    });

    const pipeline = new Pipeline(this, "reactPipeline", {
      artifactBucket,
      pipelineName: "reactClientPipeline",
      stages: [
        {
          stageName: "SourceCode",
          actions: [
            new GitHubSourceAction({
              actionName: "readLatestMasterCommit",
              branch: "main",
              output: sourceArtifact,
              oauthToken: SecretValue.secretsManager("github-token"),
              owner: "Joshrogan",
              repo: "react-client",
            }),
          ],
        },
        {
          stageName: "Build",
          actions: [
            new CodeBuildAction({
              actionName: "buildReactApp",
              input: sourceArtifact,
              outputs: [buildArtifact],
              project: reactBuildProject,
            }),
          ],
        },
        {
          stageName: "Approval",
          actions: [approvalAction],
        },
        {
          stageName: "Deploy",
          actions: [
            new S3DeployAction({
              actionName: "DeployReactApp",
              input: buildArtifact,
              bucket: websiteBucket,
            }),
          ],
        },
      ],
    });

    new SlackNotifier(this, "SlackNotifier", {
      pipeline,
      slackBotToken,
      slackSigningSecret,
      slackBotName: "Velocity",
      slackChannel,
    });

    new CfnOutput(this, "codePipelineArn", {
      value: pipeline.pipelineArn,
    });
  }
}
