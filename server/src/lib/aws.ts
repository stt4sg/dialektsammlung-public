import { getConfig } from '../config-helper';
import { S3 } from 'aws-sdk';

export namespace AWS {
  let s3 = new S3({
    ...{ signatureVersion: 'v4', useDualstack: true, region: getConfig().BUCKET_LOCATION },
    ...getConfig().S3_CONFIG,
  });

  export function getS3() {
    return s3;
  }
}
