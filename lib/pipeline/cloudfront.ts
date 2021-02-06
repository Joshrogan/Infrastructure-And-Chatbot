import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { Distribution, OriginAccessIdentity, ViewerProtocolPolicy, ErrorResponse } from '@aws-cdk/aws-cloudfront';
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { HttpsRedirect } from '@aws-cdk/aws-route53-patterns';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { Bucket } from '@aws-cdk/aws-s3';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import * as cdk from '@aws-cdk/core';
import { CfnOutput, RemovalPolicy } from '@aws-cdk/core';
import { hostedZoneId, websiteCertArn, website_domain } from '../config/pipelineConfig';

export class CloudfrontStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'websiteBucket', {
        removalPolicy: RemovalPolicy.DESTROY,
        bucketName: website_domain,
    })
    
    new CfnOutput(this, 'websiteBucketArn', {
        value: bucket.bucketArn
    })

    const originAccessIdentity = new OriginAccessIdentity(this, 'originAccessIdentity', {
        comment: 'Give cloudfront unrestricted read only access to website bucket'
    })
    
    bucket.grantRead(originAccessIdentity)

    const errResp: ErrorResponse = {httpStatus: 404, responsePagePath: '/error.html', responseHttpStatus: 400}

    const certificate = Certificate.fromCertificateArn(this, 'websiteCert', websiteCertArn)
    
    const distribution = new Distribution(this, 'cloudfrontWebDistribution', {
        defaultRootObject: 'index.html',
        defaultBehavior: {
            origin: new S3Origin(bucket),
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        }, certificate: certificate,
        domainNames: [website_domain],
        errorResponses: [errResp]
    })

    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'hostedZoneWithAttrs', {
        hostedZoneId,
        zoneName: website_domain
    })
    
    new ARecord(this, 'aliasForCloudfront', {
        target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        zone: hostedZone,
        recordName: website_domain
    })

    new HttpsRedirect(this, 'wwwToNonWww', {
        recordNames: ['www.velocityspa.net'],
        targetDomain: website_domain,
        zone:hostedZone
    })
  }
}