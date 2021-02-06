// after registering a domain with R53 you can find this out by going to the R53 console
export const hostedZoneId = 'Z0512565XSIINZ7IKJQ4'

export const website_domain = 'velocityspa.net'

// this is generated from deploying the pipeline-certificate stack
export const websiteCertArn = 'arn:aws:acm:us-east-1:509079033231:certificate/a9654e21-7015-4e32-90b8-5e4eaf4f54f7'

// for static websites, these always follow the convention 'arn:aws:s3:::DOMAIN'
export const websiteBucketArn = 'arn:aws:s3:::velocityspa.net'

export const usEast1 = { account: '509079033231', region: 'us-east-1' }
export const dublin = { account: '509079033231', region: 'eu-west-1' }