import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as Pipeline from '../lib/pipeline-stack';
import { ServiceStack } from '../lib/service-stack';



test('Pipeline Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Pipeline.PipelineStack(app, 'MyTestStack');
  // THEN
  // Template.fromStack(stack).hasResourceProperties("AWS::CodePipeline::Pipeline", {})
  expect(Template.fromStack(stack).toJSON()).toMatchSnapshot()
});

test('Adding Service Stage', () => {
  const app = new cdk.App();
  const pipeline = new Pipeline.PipelineStack(app, 'PipelineStack');
  const service = new ServiceStack(app, 'ServiceStack', {
    stageName: 'Test',
  });

  pipeline.addServiceStage(service, 'Test');

  Template.fromStack(pipeline).hasResourceProperties("AWS::CodePipeline::Pipeline", {
    Stages: Match.arrayWith([
        Match.objectLike({Name: 'Test'})
        ]
    )
  })
})
