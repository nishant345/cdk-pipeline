import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as Pipeline from '../lib/pipeline-stack';


test('Pipeline Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Pipeline.PipelineStack(app, 'MyTestStack');
  // THEN
  // Template.fromStack(stack).hasResourceProperties("AWS::CodePipeline::Pipeline", {})
  expect(Template.fromStack(stack).toJSON()).toMatchSnapshot()
});
