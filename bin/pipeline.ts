#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DomainCertificateStack } from '../lib/pipeline/domain-certificate';
import { CloudfrontStack } from '../lib/pipeline/cloudfront';
import { CodePipelineStack } from '../lib/pipeline/pipeline';
import { CodeStarSns } from '../lib/slack-bot/codestar-sns';
import { dublin, usEast1 } from '../lib/config/pipelineConfig';

const app = new cdk.App();

// 1. setup domain certs with route53 and ACM
new DomainCertificateStack(app, 'pipeline-certificate', { env: usEast1 })

// 2. initalize a bucket that will act as cloudfront origin, setup to host static site & error pages.
new CloudfrontStack(app, 'pipeline-cloudfront', { env: dublin })

// 3. pipeline to take source from github, run through codebuild and output to above bucket.
new CodePipelineStack(app, 'pipeline-codepipeline', { env: dublin })

// 4. test slack stuff
// new CodeStarSns(app, 'slackbot-codestarSns', { env: dublin })
