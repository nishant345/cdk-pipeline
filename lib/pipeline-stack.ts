import {Duration, SecretValue, Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Artifact, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {BuildSpec} from "aws-cdk-lib/aws-codebuild";
import {
  CloudFormationCreateUpdateStackAction,
  CodeBuildAction,
  GitHubSourceAction
} from "aws-cdk-lib/aws-codepipeline-actions";
import {LinuxBuildImage, PipelineProject} from "aws-cdk-lib/aws-codebuild";

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false
    });

    const cdkSourceOutput = new Artifact('CdkSourceOutput');
    const serviceSourceOutput = new Artifact('ServiceSourceOutput');

    pipeline.addStage({
      stageName: 'Source',
      actions: [
          new GitHubSourceAction({
            owner: 'nishant345',
            repo: 'cdk-pipeline',
            branch: 'main',
            actionName: 'Pipeline_Source',
            oauthToken: SecretValue.secretsManager('github-token'),
            output: cdkSourceOutput
          }),

        new GitHubSourceAction({
          owner: 'nishant345',
          repo: 'express-lambda',
          branch: 'main',
          actionName: 'Service_Source',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: serviceSourceOutput
        })
      ]
    });

    const cdkBuildOutput = new Artifact('CdkBuildOutput');

    pipeline.addStage({
      stageName: 'Build',
      actions: [new CodeBuildAction({
        actionName: "Cdk_Build",
        input: cdkSourceOutput,
        outputs: [cdkBuildOutput],
        project: new PipelineProject(this, 'CdkBuildProject', {
          environment: {
            buildImage: LinuxBuildImage.STANDARD_5_0
          },
          buildSpec: BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
        })
      })

      ]
    });

    pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [
          new CloudFormationCreateUpdateStackAction({
            actionName: 'Pipeline_Update',
            stackName: 'PipelineStack',
            templatePath: cdkBuildOutput.atPath("PipelineStack.template.json"),
            adminPermissions: true,
          }),
      ],
    });
  }
}
