#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';
import {ServiceStack} from "../lib/service-stack";

const app = new cdk.App();
const pipelineStack = new PipelineStack(app, 'PipelineStack', {});

const serviceStackTest = new ServiceStack(app, 'ServiceStackTest', {
    stageName: 'Test'
});

const serviceStackProd = new ServiceStack(app, 'ServiceStackProd', {
    stageName: 'Prod'
});

const testStage = pipelineStack.addServiceStage(serviceStackProd, "Test")
const prodStage = pipelineStack.addServiceStage(serviceStackProd, "Prod")
