# Welcome to your CDK TypeScript project!

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


# Important Files/folders
* bin/pipeline.ts - where all stacks are deployed
* slack-bot-lambdas/ - all lambdas for chatbot
* lib/pipeline/ - all infra stack code in here
* lib/slack-bot/ - all slack bot services, and it's stack in here.
