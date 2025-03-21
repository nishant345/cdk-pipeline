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
import {ServiceStack} from "./service-stack";

export class PipelineStack extends Stack {
  public readonly pipeline: Pipeline;
  public readonly cdkBuildOutput: Artifact;
  public readonly serviceBuildOutput: Artifact;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true
    });

    const cdkSourceOutput = new Artifact('CdkSourceOutput');
    const serviceSourceOutput = new Artifact('ServiceSourceOutput');

    this.pipeline.addStage({
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

    this.cdkBuildOutput = new Artifact('CdkBuildOutput');
    this.serviceBuildOutput = new Artifact('serviceBuildOutput');

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
          new CodeBuildAction({
            actionName: "Cdk_Build",
            input: cdkSourceOutput,
            outputs: [this.cdkBuildOutput],
            project: new PipelineProject(this, 'CdkBuildProject', {
              environment: {
                buildImage: LinuxBuildImage.STANDARD_5_0
              },
              buildSpec: BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
            })
          }),

        new CodeBuildAction({
          actionName: "Service_Build",
          input: serviceSourceOutput,
          outputs: [this.serviceBuildOutput],
          project: new PipelineProject(this, 'ServiceBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0
            },
            buildSpec: BuildSpec.fromSourceFilename('build-specs/service-build-spec.yml')
          })
        })
      ]
    });

    this.pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [
          new CloudFormationCreateUpdateStackAction({
            actionName: 'Pipeline_Update',
            stackName: 'PipelineStack',
            templatePath: this.cdkBuildOutput.atPath("PipelineStack.template.json"),
            adminPermissions: true,
          }),
      ],
    });
  }
  public addServiceStage(serviceStack: ServiceStack, stageName: string){
    this.pipeline.addStage({
      stageName: stageName,
      actions: [
          new CloudFormationCreateUpdateStackAction({
            actionName: 'Service_Update',
            stackName: serviceStack.stackName,
            templatePath: this.cdkBuildOutput.atPath(`${serviceStack.stackName}.template.json`),
            adminPermissions: true,
            parameterOverrides: {
              ...serviceStack.serviceCode.assign(this.serviceBuildOutput.s3Location)
            },
            extraInputs: [this.serviceBuildOutput]
          })
      ]
    })

  }
}
