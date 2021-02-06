import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager';
import { HostedZone } from '@aws-cdk/aws-route53';
import * as cdk from '@aws-cdk/core';
import { CfnOutput } from '@aws-cdk/core';
import { hostedZoneId, website_domain } from '../config/pipelineConfig';

export class DomainCertificateStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);
      const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
          hostedZoneId,
          zoneName: website_domain
      })
  
      const websiteCertificate = new DnsValidatedCertificate(this, 'DnsCert', {
          domainName: website_domain,
          hostedZone
      })
  
      new CfnOutput(this, 'WebsiteCertARN', {
          value: websiteCertificate.certificateArn
      })
    }
  }