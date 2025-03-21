import {aws_lambda, Stack, StackProps} from "aws-cdk-lib";
import { Construct } from 'constructs';
import {HttpApi} from "aws-cdk-lib/aws-apigatewayv2";
import {HttpLambdaIntegration} from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class ServiceStack extends Stack {
    public readonly serviceCode: aws_lambda.CfnParametersCode;
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.serviceCode = aws_lambda.Code.fromCfnParameters()

        const lambda = new aws_lambda.Function(this, 'ServiceLambda', {
            runtime: aws_lambda.Runtime.NODEJS_16_X,
            handler: 'src/lambda.handler',
            code: this.serviceCode,
            functionName: 'ServiceLambda',
        })

        new HttpApi(this, 'Service API', {
            defaultIntegration: new HttpLambdaIntegration("LambdaIntegration", lambda),
            apiName: 'MyService',
        });
    }
}